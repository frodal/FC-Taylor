!-----------------------------------------------------------------------
!                         SUBROUTINE readeuler
!-----------------------------------------------------------------------
! Reads Euler angles
! 
!-----------------------------------------------------------------------
      subroutine readeuler(ang,nangmax,k)
!
      implicit none
!
      integer, intent(in) :: nangmax
	  integer, intent(out) :: k
	  real*8, intent(out) :: ang(nangmax,4)
!     Local variables
	  integer ios,readflag
	  character*1000 line
	  LOGICAL THERE
!-----------------------------------------------------------------------
!         Initial and default values
!-----------------------------------------------------------------------
	  ang         = 0.d0
	  ios         = 0
	  readflag    = 0
!-----------------------------------------------------------------------
!         Reading information/input file
!-----------------------------------------------------------------------
	  INQUIRE( FILE=trim('Input/Euler.inp'), EXIST=THERE )
	  if (.not.there) then
		write(6,*) '!! Error'
		write(6,*) './Input/Euler.inp not found'
		stop
	  endif
	  open(unit=16,file=trim('Input/Euler.inp'),status='old',
     +         iostat=ios,access='sequential',action='read')
	  do while(ios == 0)
	  ! Read all the lines that do not begin with "**"
		read(16,fmt='(A)',end=77) line
		if (line(1:2) .ne. '**') then 
        ! First find the type of keyword
            if (line(1:6) .eq. '*EULER') then
                readflag = 1
				k=1
                goto 78
			elseif (line(1:1) .eq. '*') then
				readflag = 0
				write(6,*) '!! Error'
				write(6,*) 'Unknown keyword: ', trim(line)
				write(6,*) 'Please use one of the following keywords;'
				write(6,*) '*PROPS, *DEF or *EULER'
				stop
            endif
          ! Then read the input data and assign to scalar/array 
            if (readflag .eq. 1) then
                read(line,*,end=78) ang(k,1),ang(k,2),ang(k,3),ang(k,4)
				if (ang(k,4).le.0.d0) then
					write(6,*) '!! Error'
					write(6,*) 'Orientation weight must be positive'
					write(6,*) 'Weight: ',ang(k,4)
					write(6,*) 'At k: ', k
					stop
				endif
				k=k+1
            endif
        endif
   78 continue
      enddo
   77 continue
      close(unit=16)
	  k=k-1
!-----------------------------------------------------------------------
!         Write information
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
	  if (k.gt.nangmax) then
		write(6,*) '!! Error'
		write(6,*) 'Too many orientations given:     ',k
		write(6,*) 'Please use less then or equal to:',nangmax
		stop
	  else
	  write(6,*) 'Euler Angles read successfully'
	  write(6,*) 'Number of orientations read: ',k
	  endif
      write(6,*) '----------------------------------------------------'
!
      return
      end subroutine readeuler
!
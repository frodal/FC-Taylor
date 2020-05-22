!-----------------------------------------------------------------------
!                         SUBROUTINE readeuler
!-----------------------------------------------------------------------
! Reads Euler angles
! 
!-----------------------------------------------------------------------
      subroutine readeuler(ang,nangmax)
!-----------------------------------------------------------------------
      use functions
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: nangmax
      real*8, intent(out) :: ang(nangmax,4)
!     Local variables
      integer ios,readflag,k
      character*1000 line
      LOGICAL THERE
!-----------------------------------------------------------------------
!         Initial and default values
!-----------------------------------------------------------------------
      ang         = 0.d0
      ios         = 0
      readflag    = 0
      k           = 1
!-----------------------------------------------------------------------
!         Reading information/input file
!-----------------------------------------------------------------------
      INQUIRE( FILE=trim('Input/Euler.inp'), EXIST=THERE )
      if (.not.there) then
        write(6,*) '!! Error'
        write(6,*) './Input/Euler.inp not found'
        call sleep(1)
        error stop 'Error code: 15'
      endif
      open(unit=16,file=trim('Input/Euler.inp'),status='old',
     +         iostat=ios,access='sequential',action='read')
      do while(ios == 0)
      ! Read all the lines that do not begin with "**"
        read(16,fmt='(A)',end=77) line
        if (line(1:2) .ne. '**') then 
        ! First find the type of keyword
          if (to_upper(line(1:6)) .eq. '*EULER') then
            readflag = 1
            goto 78
          elseif (line(1:1) .eq. '*') then
            readflag = 0
            write(6,*) '!! Error'
            write(6,*) 'Unknown keyword: ', trim(line)
            write(6,*) 'Please use one of the following keywords;'
            write(6,*) '*EULER'
            close(unit=16)
            call sleep(1)
            error stop 'Error code: 16'
          endif
          ! Then read the input data and assign to scalar/array 
          if (readflag .eq. 1) then
            read(line,*,end=78) ang(k,1),ang(k,2),ang(k,3),ang(k,4)
            if (ang(k,4).le.0.d0) then
              write(6,*) '!! Error'
              write(6,*) 'Orientation weight must be positive'
              write(6,*) 'Weight: ',ang(k,4)
              write(6,*) 'At k: ', k
              close(unit=16)
              call sleep(1)
              error stop 'Error code: 17'
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
      return
      end subroutine readeuler
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!                         SUBROUTINE readeulerlength
!-----------------------------------------------------------------------
! Reads Euler angles length
! 
!-----------------------------------------------------------------------
      subroutine readeulerlength(k)
!-----------------------------------------------------------------------
      use functions
      implicit none
!-----------------------------------------------------------------------
      integer, intent(out) :: k
!     Local variables
      real*8 temp(4)
      integer ios,readflag
      character*1000 line
      LOGICAL THERE
!-----------------------------------------------------------------------
!         Initial and default values
!-----------------------------------------------------------------------
      temp        = 0.d0
      ios         = 0
      readflag    = 0
      k           = 1
!-----------------------------------------------------------------------
!         Reading information/input file
!-----------------------------------------------------------------------
      INQUIRE( FILE=trim('Input/Euler.inp'), EXIST=THERE )
      if (.not.there) then
        write(6,*) '!! Error'
        write(6,*) './Input/Euler.inp not found'
        call sleep(1)
        error stop 'Error code: 15'
      endif
      open(unit=16,file=trim('Input/Euler.inp'),status='old',
     +         iostat=ios,access='sequential',action='read')
      do while(ios == 0)
      ! Read all the lines that do not begin with "**"
        read(16,fmt='(A)',end=77) line
        if (line(1:2) .ne. '**') then 
        ! First find the type of keyword
          if (to_upper(line(1:6)) .eq. '*EULER') then
            readflag = 1
            goto 78
          elseif (line(1:1) .eq. '*') then
            readflag = 0
            write(6,*) '!! Error'
            write(6,*) 'Unknown keyword: ', trim(line)
            write(6,*) 'Please use one of the following keywords;'
            write(6,*) '*EULER'
            close(unit=16)
            call sleep(1)
            error stop 'Error code: 16'
          endif
          ! Then read the input data and assign to scalar/array 
          if (readflag .eq. 1) then
            read(line,*,end=78) temp(1),temp(2),temp(3),temp(4)
            if (temp(4).le.0.d0) then
              write(6,*) '!! Error'
              write(6,*) 'Orientation weight must be positive'
              write(6,*) 'Weight: ',temp(4)
              write(6,*) 'At k: ', k
              close(unit=16)
              call sleep(1)
              error stop 'Error code: 17'
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
      return
      end subroutine readeulerlength
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!                         SUBROUTINE readuniqueeulerlength
!-----------------------------------------------------------------------
! Reads the unique number of Euler angles
! 
!-----------------------------------------------------------------------
      subroutine readuniqueeulerlength(NuniqueAng,Nang)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(out) :: NuniqueAng,Nang
!     Local variables
      real*8, allocatable :: ang(:,:)
      integer i,j,unique
!-----------------------------------------------------------------------
!         Load euler angles
!-----------------------------------------------------------------------
      call readeulerlength(Nang)
      if(Nang.eq.0)then
        write(6,*) '!! Error'
        write(6,*) 'No orientations read!'
        write(6,*) 'Please make sure to use the keyword:*EULER'
        write(6,*) 'followed by lines of Euler angles and a weight'
        write(6,*) ''
        write(6,*) '*EULER'
        write(6,*) 'phi1, PHI, phi2, weight'
        call sleep(1)
        error stop 'Error code: 18'
      endif
      allocate(ang(Nang,4))
      call readeuler(ang,Nang)
!-----------------------------------------------------------------------
!         Find how many of the angles are unique
!-----------------------------------------------------------------------
      NuniqueAng = 1
      if(Nang.lt.2)then
          NuniqueAng = Nang
      else
          do i=2,Nang
              unique = 1
              do j=1,i-1
                  if((ang(i,1).eq.ang(j,1)).and.
     &               (ang(i,2).eq.ang(j,2)).and.
     &               (ang(i,3).eq.ang(j,3)))then 
                      unique = 0
                  endif
              enddo
              if(unique.eq.1) NuniqueAng = NuniqueAng + 1
          enddo
      endif
!-----------------------------------------------------------------------
!     Deallocate allocated memory
!-----------------------------------------------------------------------
      if(allocated(ang)) deallocate(ang)
!-----------------------------------------------------------------------
      return
      end subroutine readuniqueeulerlength
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!                         SUBROUTINE readuniqueeuler
!-----------------------------------------------------------------------
! Reads the unique Euler angles
! 
!-----------------------------------------------------------------------
      subroutine readuniqueeuler(uniqueAng,NuniqueAng,Nang)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: NuniqueAng,Nang
      real*8, intent(inout) :: uniqueAng(NuniqueAng,4)
!     Local variables
      real*8 ang(Nang,4)
      integer i,j,k,unique
!-----------------------------------------------------------------------
!         Load euler angles
!-----------------------------------------------------------------------
      call readeuler(ang,Nang)
!-----------------------------------------------------------------------
!         Write information
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
      write(6,*) 'Euler Angles read successfully'
      write(6,*) 'Number of orientations read: ',Nang
      write(6,*) 'Number of unique orientations: ',NuniqueAng
      write(6,*) '----------------------------------------------------'
!-----------------------------------------------------------------------
      if(NuniqueAng.eq.Nang)then
          uniqueAng = ang
      else
!-----------------------------------------------------------------------
!         Find the unique angles and accumulate the weight
!-----------------------------------------------------------------------
          k = 1
          uniqueAng(1,1) = ang(1,1)
          uniqueAng(1,2) = ang(1,2)
          uniqueAng(1,3) = ang(1,3)
          uniqueAng(1,4) = ang(1,4)
          do i=2,Nang
              unique = 1
              do j=1,i-1
                  if((ang(i,1).eq.ang(j,1)).and.
     &               (ang(i,2).eq.ang(j,2)).and.
     &               (ang(i,3).eq.ang(j,3)))then 
                      unique = 0
                  endif
              enddo
              if(unique.eq.1)then
                  k = k + 1
                  uniqueAng(k,1) = ang(i,1)
                  uniqueAng(k,2) = ang(i,2)
                  uniqueAng(k,3) = ang(i,3)
                  uniqueAng(k,4) = ang(i,4)
              else
                  do j=1,k
                      if((ang(i,1).eq.uniqueAng(j,1)).and.
     &                   (ang(i,2).eq.uniqueAng(j,2)).and.
     &                   (ang(i,3).eq.uniqueAng(j,3)))then 
                          uniqueAng(j,4) = uniqueAng(j,4) + ang(i,4)
                      endif
                  enddo
              endif
          enddo
      endif
!-----------------------------------------------------------------------
      return
      end subroutine readuniqueeuler
!-----------------------------------------------------------------------
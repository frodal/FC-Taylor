!-----------------------------------------------------------------------
!                         SUBROUTINE readprops
!-----------------------------------------------------------------------
! Reads information to the FORTRAN program
!
!-----------------------------------------------------------------------
      subroutine readprops(props,nprops,
     .                     planestress,centro,npts,epsdot,wp,ncpus)
!-----------------------------------------------------------------------
      use functions
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: nprops
      real*8, intent(out) :: props(nprops), epsdot, wp
      integer, intent(out) :: planestress, centro, npts, ncpus
!     Local variables
      real*8 dummy(nprops)
      integer ios,readflag,tmpcpu,omp_get_num_procs
      character*1000 line
      LOGICAL THERE
!-----------------------------------------------------------------------
!     Initial and default values
!-----------------------------------------------------------------------
      props       = 0.d0
      ios         = 0
      readflag    = 0
      ! Default values
      planestress = 1
      centro      = 1
      npts        = 2
      ncpus       = 1
      tmpcpu      = 1
      epsdot      = 1.d-3
      wp          = 2.d-1
      dummy       = 0.d0
      dummy(1)    = 106430.d0
      dummy(2)    = 60350.d0
      dummy(3)    = 28210.d0
      dummy(4)    = 1.d-2
      dummy(5)    = 5.d-3
      dummy(6)    = 25.d0
      dummy(7)    = 1.4d0
      dummy(8)    = 1
      dummy(9)    = 200.d0
      dummy(10)   = 10.d0
      dummy(11)   = 25.d0
      dummy(12)   = 15.d0
!-----------------------------------------------------------------------
!     Reading information/input file
!-----------------------------------------------------------------------
      INQUIRE( FILE=trim('Input/Taylor.inp'), EXIST=THERE )
      if (.not.there) then
        write(6,*) '!! Error'
        write(6,*) './Input/Taylor.inp not found'
        call sleep(1)
        error stop 'Error code: 12'
      endif
      open(unit=16,file=trim('Input/Taylor.inp'),status='old',
     +         iostat=ios,access='sequential',action='read')
      do while(ios == 0)
      ! Read all the lines that do not begin with "**"
        read(16,fmt='(A)',end=77) line
        if (line(1:2) .ne. '**') then
        ! First find the type of keyword
          if (to_upper(line(1:6)) .eq. '*PROPS') then
            readflag = 1
            goto 78
          elseif (to_upper(line(1:4)) .eq. '*DEF') then
            readflag = 2
            goto 78
          elseif (line(1:1) .eq. '*') then
            readflag = 0
            write(6,*) 'Unknown keyword: ', trim(line)
            write(6,*) 'Please use one of the following keywords;'
            write(6,*) '*PROPS or *DEF'
            call sleep(1)
            error stop 'Error code: 13'
          endif
          ! Then read the input data and assign to scalar/array
          if (readflag .eq. 1) then
            read(line,*,end=78) dummy
            readflag = 0
          elseif (readflag .eq. 2) then
            read(line,*,end=78) planestress,centro,npts,epsdot,wp,tmpcpu
            readflag = 0
          endif
        endif
   78 continue
      enddo
   77 continue
      close(unit=16)
!-----------------------------------------------------------------------
!     Assigning values to the properties variable
!-----------------------------------------------------------------------
      props(1) = dummy(1)
      props(2) = dummy(2)
      props(3) = dummy(3)
      props(4) = dummy(4)
      props(5) = dummy(5)
      props(6) = dummy(6)
      props(7) = dummy(7)
      props(8) = 2
      props(9) = 0.0
      props(10) = 0.0
      props(11) = 0.0
      props(12) = dummy(8)
      props(13) = dummy(9)
      props(14) = dummy(10)
      props(15) = dummy(11)
      props(16) = dummy(12)
      if(npts.lt.2)then
        write(6,*) 'Error! npts must be greater or equal to 2'
        call sleep(1)
        error stop 'Error code: 14'
      endif
      if(epsdot.le.0.d0)then
        write(6,*) 'Warning! epsdot should be greater than zero'
        write(6,*) 'Using epsdot = 1.d-3'
        epsdot = 1.d-3
      endif
      if(wp.le.0.d0)then
        write(6,*) 'Warning! Wp should be greater than zero'
        write(6,*) 'Using Wp = 2.d-1'
        wp = 2.d-1
      endif
!-----------------------------------------------------------------------
!     Write information
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
      write(6,*) '|                                                  |'
      write(6,*) '|                FC-Taylor program                 |'
      write(6,*) '|                                                  |'
      write(6,*) '|              by Bjorn Hakon Frodal               |'
      write(6,*) '|              bjorn.h.frodal@ntnu.no              |'
      write(6,*) '|                                                  |'
      write(6,*) '|             Copyright (c) 2018-2021              |'
      write(6,*) '|                Bjorn Hakon Frodal                |'
      write(6,*) '|      Structural Impact Laboratory (SIMLab),      |'
      write(6,*) '|       Department of Structural Engineering,      |'
      write(6,*) '|  Norwegian University of Science and Technology, |'
      write(6,*) '|                Trondheim, Norway.                |'
      write(6,*) '|                                                  |'
      write(6,*) '|                      v0.13.0                     |'
      write(6,*) '|                                                  |'
      write(6,*) '|--------------------------------------------------|'
      write(6,*) '|                                                  |'
      write(6,*) '|                      INPUT                       |'
      write(6,*) '|                                                  |'
      write(6,*) '----------------------------------------------------'
      write(6,*) 'C11        =',props(1)
      write(6,*) 'C12        =',props(2)
      write(6,*) 'C44        =',props(3)
      write(6,*) 'gamma0_dot =',props(4)
      write(6,*) 'm          =',props(5)
      write(6,*) 'tau0_c     =',props(6)
      write(6,*) 'q          =',props(7)
      write(6,*) 'hflag      =',props(12)
      if(nint(props(12)).eq.1)then
        write(6,*) 'theta1     =',props(13)
        write(6,*) 'tau1       =',props(14)
        write(6,*) 'theta2     =',props(15)
        write(6,*) 'tau2       =',props(16)
      elseif(nint(props(12)).eq.2)then
        write(6,*) 'h0         =',props(13)
        write(6,*) 'tau_s      =',props(14)
        write(6,*) 'a          =',props(15)
      else
        write(6,*) '!! Error'
        write(6,*) 'Unknown hardening model'
        write(6,*) 'Please use a hflag of 1 or 2'
        call sleep(1)
        error stop 'Error code: 19'
      endif
      write(6,*) '----------------------------------------------------'
      write(6,*) 'Imposed strain rate: ',epsdot
      write(6,*) 'Maximum plastic work:',wp
      write(6,*) 'Resolution of strain space grid, npts =',npts
      if(planestress.eq.1)then
        write(6,*) 'Stress space dimension: 2D'
      else
        write(6,*) 'Stress space dimension: 3D'
      endif
      if(centro.eq.1)then
        write(6,*) 'Centrosymmetry used'
      else
        write(6,*) 'Centrosymmetry not used'
      endif
!-----------------------------------------------------------------------
!     The following code is compiled if OpenMP is used
!-----------------------------------------------------------------------
!$    if(tmpcpu.eq.0) then
!$      ncpus = OMP_get_num_procs()
!$    elseif(tmpcpu.lt.0) then
!$      ncpus = 1
!$    elseif(tmpcpu.gt.(OMP_get_num_procs())) then
!$      ncpus = OMP_get_num_procs()
!$    else
!$      ncpus = tmpcpu
!$    endif
      write(6,*) 'Number of threads/cpus used:',ncpus
      write(6,*) '----------------------------------------------------'
!-----------------------------------------------------------------------
      return
      end subroutine readprops
!-----------------------------------------------------------------------
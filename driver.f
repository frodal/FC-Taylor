!-----umat subroutine
      include '../SIMLab/scmm-hypo/Hypo.f'
	  include './readprops.f'
	  include './readeuler.f'
	  include './Deformation.f'
!-----------------------------------------------------------------------
!     Driver program
!-----------------------------------------------------------------------
      program driver
      implicit none
      real*8, allocatable :: ang(:,:), STRESSOLD(:,:), STRESSNEW(:,:),
     .                  STATEOLD(:,:), STATENEW(:,:), defgradNew(:,:),
     .                  defgradOld(:,:), Dissipation(:), Dij(:,:),
     .                  sigma(:,:)
	  integer nDmax,nprops
      integer k,ITER,ndef,i,km,planestress,centro,npts
      integer NITER,NSTATEV,nblock
      parameter(nprops=16,NSTATEV=28)
      real*8 deps11,deps22,deps33,deps12,deps23,deps31
      real*8 strain(6),epsdot,wp
	  real*8 domega32,domega13,domega21
      CHARACTER*12 DATE1,TIME1
c
      real*8 printDelay,currentTime,printTime
      real*8 DT
      real*8 PROPS(nprops)
	  real*8 work
	  real*8 totweight
      real*8 oneovertotweight
      real*8 one,zero
      parameter(zero=0.d0,one=1.d0,printDelay=5.d0*60.d0)
!-----------------------------------------------------------------------
!     Define some parameters
!-----------------------------------------------------------------------
!
!-----------------------------------------------------------------------
!     Define material properties
!-----------------------------------------------------------------------
	  call readprops(props,nprops,planestress,centro,npts,epsdot,wp)			! Read material properties and stuff...
	  call readeulerlength(nblock)
      allocate(ang(nblock,4))
      allocate(STRESSOLD(nblock,6))
      allocate(STRESSNEW(nblock,6))
      allocate(STATEOLD(nblock,NSTATEV))
      allocate(STATENEW(nblock,NSTATEV))
      allocate(defgradNew(nblock,9))
      allocate(defgradOld(nblock,9))
      allocate(Dissipation(nblock))
      call readeuler(ang,nblock)	! Read Euler angles and weights
	  totweight = zero
	  do i=1,nblock
		totweight = totweight + ang(i,4)
	  enddo
      oneovertotweight = one/totweight
!-----------------------------------------------------------------------
!     Define loading
!-----------------------------------------------------------------------
      if (planestress.eq.1) then
		nDmax = 6*(npts-2)**2 + 12*(npts-2) + 8
	  else
		nDmax = 10*(npts-2)**4 + 40*(npts-2)**3 +
     +  80*(npts-2)**2 + 80*(npts-2) + 32
	  endif
      allocate(Dij(nDmax,6))
      call deformation(Dij,nDmax,ndef,planestress,centro,npts,epsdot)
      allocate(sigma(ndef,7))
      sigma = zero
c
      NITER  = 10001 ! Max number of iterations
c
      DT     = wp/(epsdot*props(6)*1.d3) ! dt=wp/(M*Niter*tauc_0*epsdot) (M=3,Niter=1000)
!-----------------------------------------------------------------------
!     Write to start date and time
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
      call DATE_AND_TIME(DATE1,TIME1)
      call cpu_time(printTime)
      write(6,*)'Started: ',DATE1(7:8),'.',DATE1(5:6),'.',
     &           DATE1(1:4),' at ',TIME1(1:2),':',TIME1(3:4),':',
     &           TIME1(5:6)
      write(6,*) '----------------------------------------------------'
!-----------------------------------------------------------------------
!     Loop over deformation points
!-----------------------------------------------------------------------
      do km=1,ndef
!-----------------------------------------------------------------------
!     Initialize some variables
!-----------------------------------------------------------------------
	  work = zero
c
      STRESSOLD = zero
      STRESSNEW = zero
c
      do i=1,nblock
		STATEOLD(i,1) = ang(i,1)
		STATEOLD(i,2) = ang(i,2)
		STATEOLD(i,3) = ang(i,3)
	  enddo
      do k=4,NSTATEV
		do i=1,nblock
			STATEOLD(i,k) = zero
			STATENEW(i,k) = zero
		enddo
	  enddo
c
	  do i=1,nblock
        defgradOld(i,1) = one
        defgradOld(i,2) = one
        defgradOld(i,3) = one
        defgradOld(i,4) = zero
        defgradOld(i,5) = zero
        defgradOld(i,6) = zero
        defgradOld(i,7) = zero
        defgradOld(i,8) = zero
        defgradOld(i,9) = zero
	  enddo
!-----------------------------------------------------------------------
!     Start loop
!-----------------------------------------------------------------------
      iter = 0
      do while((work.lt.wp).and.(ITER.lt.NITER))
        iter = iter+1
!-----------------------------------------------------------------------
!        Extract strain increments 
!-----------------------------------------------------------------------
            do i=1,nblock
				defgradNew(i,1) = defgradOld(i,1)*(Dij(km,1)*dt+one)
     +           +defgradOld(i,7)*Dij(km,4)*dt
     +           +defgradOld(i,6)*Dij(km,6)*dt
				defgradNew(i,2) = defgradOld(i,2)*(Dij(km,2)*dt+one)
     +           +defgradOld(i,4)*Dij(km,4)*dt
     +           +defgradOld(i,8)*Dij(km,5)*dt
				defgradNew(i,3) = defgradOld(i,3)*(Dij(km,3)*dt+one)
     +           +defgradOld(i,9)*Dij(km,6)*dt
     +           +defgradOld(i,5)*Dij(km,5)*dt
				defgradNew(i,4) = defgradOld(i,4)*(Dij(km,1)*dt+one)
     +           +defgradOld(i,2)*Dij(km,4)*dt
     +           +defgradOld(i,8)*Dij(km,6)*dt
				defgradNew(i,5) = defgradOld(i,5)*(Dij(km,2)*dt+one)
     +           +defgradOld(i,9)*Dij(km,4)*dt
     +           +defgradOld(i,3)*Dij(km,5)*dt
				defgradNew(i,6) = defgradOld(i,6)*(Dij(km,3)*dt+one)
     +           +defgradOld(i,1)*Dij(km,6)*dt
     +           +defgradOld(i,7)*Dij(km,5)*dt
				defgradNew(i,7) = defgradOld(i,7)*(Dij(km,2)*dt+one)
     +           +defgradOld(i,1)*Dij(km,4)*dt
     +           +defgradOld(i,6)*Dij(km,5)*dt
				defgradNew(i,8) = defgradOld(i,8)*(Dij(km,3)*dt+one)
     +           +defgradOld(i,4)*Dij(km,6)*dt
     +           +defgradOld(i,2)*Dij(km,5)*dt
				defgradNew(i,9) = defgradOld(i,9)*(Dij(km,1)*dt+one)
     +           +defgradOld(i,5)*Dij(km,4)*dt
     +           +defgradOld(i,3)*Dij(km,6)*dt
			enddo
!-----------------------------------------------------------------------
!        CALL UMAT
!-----------------------------------------------------------------------
         CALL Hypo(stressNew,stateNew,defgradNew,
     +               stressOld,stateOld,defgradOld,dt,props,
     +               nblock,3,3,nstatev,nprops,Dissipation)
!-----------------------------------------------------------------------
!        UPDATE VARIABLES FOR NEXT TIME STEP
!-----------------------------------------------------------------------
         STRESSOLD = STRESSNEW
         STATEOLD = STATENEW
         defgradOld = defgradNew
		 do i=1,nblock
			work = work + Dissipation(i)*ang(i,4)*oneovertotweight
		 enddo
      enddo
      if (work.ge.wp) then
!-----------------------------------------------------------------------
!     Write to window if enough time has passed
!-----------------------------------------------------------------------
        call cpu_time(currentTime)
        if((currentTime.ge.(printTime+printDelay)).or.
     .      (km.eq.ndef))then
            printTime = printTime+printDelay
            write(6,*) 'Deformation points completed: ',
     .                  km, ' of ', ndef
        endif
!        write(6,*) iter
!-----------------------------------------------------------------------
!     Calculate stress based on the Taylor hypothesis
!-----------------------------------------------------------------------
        do i=1,nblock
            sigma(km,1) = sigma(km,1)+STRESSNEW(i,1)*ang(i,4)
            sigma(km,2) = sigma(km,2)+STRESSNEW(i,2)*ang(i,4)
            sigma(km,3) = sigma(km,3)+STRESSNEW(i,3)*ang(i,4)
            sigma(km,4) = sigma(km,4)+STRESSNEW(i,4)*ang(i,4)
            sigma(km,5) = sigma(km,5)+STRESSNEW(i,5)*ang(i,4)
            sigma(km,6) = sigma(km,6)+STRESSNEW(i,6)*ang(i,4)
        enddo
        sigma(km,1) = sigma(km,1)-sigma(km,3)	! Superpose a hydrostatic stress so that s33=0
        sigma(km,2) = sigma(km,2)-sigma(km,3)	! Yielding is not dependent upon hydrostatic stress!
        sigma(km,3) = sigma(km,3)-sigma(km,3)
        sigma(km,7) = work
        sigma(km,1:6) = sigma(km,1:6)*oneovertotweight
      endif
      if (ITER.ge.NITER) then
        write(6,*) '!! Error'
        write(6,*) 'Maximum number of iterations reached'
        stop
      endif
      enddo
!-----------------------------------------------------------------------
!     Write the result to file
!-----------------------------------------------------------------------
      open (unit = 2, file = ".\Output\output.txt")
      WRITE(2,*) 'S11, S22, S33, S12, S23, S31, wp'
      do km=1,ndef
        write(2,98) sigma(km,1),sigma(km,2),sigma(km,3),sigma(km,4),
     +              sigma(km,5),sigma(km,6), sigma(km,7)
      enddo
	  close(2)
!-----------------------------------------------------------------------
!     Write to finish date and time
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
      CALL DATE_AND_TIME(DATE1,TIME1)
      write(6,*)'Finished: ',DATE1(7:8),'.',DATE1(5:6),'.',
     &           DATE1(1:4),' at ',TIME1(1:2),':',TIME1(3:4),':',
     &           TIME1(5:6)
      write(6,*) '----------------------------------------------------'
!-----------------------------------------------------------------------
!     END PROGRAM
!-----------------------------------------------------------------------
      stop
   98 FORMAT(es15.6e3,',',es15.6e3,',',es15.6e3,',',es15.6e3,
     +              ',',es15.6e3,',',es15.6e3,',',es15.6e3)
      end

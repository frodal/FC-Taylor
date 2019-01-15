!-----umat subroutine
      include './Hypo.f'
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
     .                  defgradOld(:,:), Dissipation(:), Dij(:,:)
	  integer nDmax,nprops
      integer k,ITER,ndef,i,km,planestress,centro,npts
      integer NITER,NSTATEV,nblock
      parameter(nprops=16,NSTATEV=28)
      real*8 deps11,deps22,deps33,deps12,deps23,deps31
      real*8 strain(6),epsdot,wp
	  real*8 domega32,domega13,domega21
c
      real*8 TIME
      real*8 DT
      real*8 PROPS(nprops)
	  real*8 work
	  real*8 totweight
      real*8 oneovertotweight
	  real*8 sigma(6)
      real*8 one,zero
      parameter(zero=0.d0,one=1.d0)
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
c
      NITER  = 1000001 ! Max number of iterations
c
      DT     = wp/(epsdot*props(6)*3.d3) ! dt=wp/(M*Niter*tauc_0*epsdot) (M=3,Niter=1000)
!-----------------------------------------------------------------------
!     Write to file
!-----------------------------------------------------------------------
	  open (unit = 2, file = ".\Output\output.txt")
      WRITE(2,*) 'S11, S22, S33, S12, S23, S31, wp'
!-----------------------------------------------------------------------
!     Loop over deformation points
!-----------------------------------------------------------------------
	  km = 0
   12 continue
	  km=km+1
	  if (km.gt.ndef) then
			goto 51
	  endif
!-----------------------------------------------------------------------
!     Initialize some variables
!-----------------------------------------------------------------------
      TIME = zero
	  work = zero
c
      do i=1,nblock
        STRESSOLD(i,1) = zero
        STRESSNEW(i,1) = zero
        STRESSOLD(i,2) = zero
        STRESSNEW(i,2) = zero
        STRESSOLD(i,3) = zero
        STRESSNEW(i,3) = zero
        STRESSOLD(i,4) = zero
        STRESSNEW(i,4) = zero
        STRESSOLD(i,5) = zero
        STRESSNEW(i,5) = zero
        STRESSOLD(i,6) = zero
        STRESSNEW(i,6) = zero
	  enddo
c
      do k=1,NSTATEV
		do i=1,nblock
			STATEOLD(i,k) = zero
			STATENEW(i,k) = zero
		enddo
	  enddo
	  do i=1,nblock
		STATEOLD(i,1) = ang(i,1)
		STATEOLD(i,2) = ang(i,2)
		STATEOLD(i,3) = ang(i,3)
	  enddo
c
	  do i=1,nblock
        defgradOld(i,1) = one
        defgradNew(i,1) = one
        defgradOld(i,2) = one
        defgradNew(i,2) = one
        defgradOld(i,3) = one
        defgradNew(i,3) = one
        defgradOld(i,4) = zero
        defgradNew(i,4) = zero
        defgradOld(i,5) = zero
        defgradNew(i,5) = zero
        defgradOld(i,6) = zero
        defgradNew(i,6) = zero
        defgradOld(i,7) = zero
        defgradNew(i,7) = zero
        defgradOld(i,8) = zero
        defgradNew(i,8) = zero
        defgradOld(i,9) = zero
        defgradNew(i,9) = zero
	  enddo
!-----------------------------------------------------------------------
!     Start loop
!-----------------------------------------------------------------------
      do ITER=1,NITER
!-----------------------------------------------------------------------
!        Extract strain increments 
!-----------------------------------------------------------------------
         if(time.gt.zero)then
c
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
         endif
!-----------------------------------------------------------------------
!        CALL UMAT
!-----------------------------------------------------------------------
         CALL Hypo(stressNew,stateNew,defgradNew,nblock,
     +               stressOld,stateOld,defgradOld,dt,props,
     +               nblock,3,3,nstatev,nprops,Dissipation)
!-----------------------------------------------------------------------
!        UPDATE TIME
!-----------------------------------------------------------------------
         TIME = TIME+DT
!-----------------------------------------------------------------------
!        UPDATE VARIABLES FOR NEXT TIME STEP
!-----------------------------------------------------------------------
         do i=1,nblock
			STRESSOLD(i,1) = STRESSNEW(i,1)
            STRESSOLD(i,2) = STRESSNEW(i,2)
            STRESSOLD(i,3) = STRESSNEW(i,3)
            STRESSOLD(i,4) = STRESSNEW(i,4)
            STRESSOLD(i,5) = STRESSNEW(i,5)
            STRESSOLD(i,6) = STRESSNEW(i,6)
		 enddo
		 do k=1,NSTATEV
			do i=1,nblock
				STATEOLD(i,k) = STATENEW(i,k)
			enddo
		 enddo
		 do i=1,nblock
			defgradOld(i,1) = defgradNew(i,1)
            defgradOld(i,2) = defgradNew(i,2)
            defgradOld(i,3) = defgradNew(i,3)
            defgradOld(i,4) = defgradNew(i,4)
            defgradOld(i,5) = defgradNew(i,5)
            defgradOld(i,6) = defgradNew(i,6)
            defgradOld(i,7) = defgradNew(i,7)
            defgradOld(i,8) = defgradNew(i,8)
            defgradOld(i,9) = defgradNew(i,9)
		 enddo
		 do i=1,nblock
			work = work + Dissipation(i)*ang(i,4)*oneovertotweight
		 enddo
		 if (work.ge.wp) then
            sigma = zero
            do i=1,nblock
               sigma(1) = sigma(1)+STRESSNEW(i,1)*ang(i,4)
			   sigma(2) = sigma(2)+STRESSNEW(i,2)*ang(i,4)
			   sigma(3) = sigma(3)+STRESSNEW(i,3)*ang(i,4)
			   sigma(4) = sigma(4)+STRESSNEW(i,4)*ang(i,4)
			   sigma(5) = sigma(5)+STRESSNEW(i,5)*ang(i,4)
			   sigma(6) = sigma(6)+STRESSNEW(i,6)*ang(i,4)
            enddo
            sigma = sigma*oneovertotweight
			sigma(1) = sigma(1)-sigma(3)	! Superpose a hydrostatic stress so that s33=0
			sigma(2) = sigma(2)-sigma(3)	! Yielding is not dependent upon hydrostatic stress!
			sigma(3) = sigma(3)-sigma(3)
			write(2,98) sigma(1),sigma(2),sigma(3),sigma(4),
     +                  sigma(5),sigma(6), work
			goto 12
		 endif
		 if (ITER.ge.NITER) then
			write(6,*) '!! Error'
			write(6,*) 'Maximum number of iterations reached'
            close(2)
			stop
		 endif
      enddo
   51 continue
	  close(2)
!-----------------------------------------------------------------------
!     END PROGRAM
!-----------------------------------------------------------------------
      stop
   98 FORMAT(es15.6e3,',',es15.6e3,',',es15.6e3,',',es15.6e3,
     +              ',',es15.6e3,',',es15.6e3,',',es15.6e3)
      end

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
	  !parameter(nangmax=100000,nDmax=2808992)
      parameter(nprops=250)
      integer k,ITER,ndef,i,km
      integer NITER,NSTATEV,nblock
      parameter(NSTATEV=28)
      real*8 deps11,deps22,deps33,deps12,deps23,deps31
      real*8 strain(6)
      !real*8 ang(nangmax,4),Dij(nDmax,6)
	  real*8 domega32,domega13,domega21
c
      real*8 TIME
      real*8 DT
      real*8 PROPS(nprops)
      !real*8 STRESSOLD(nangmax,6)
      !real*8 STRESSNEW(nangmax,6)
      !real*8 STATEOLD(nangmax,NSTATEV)
      !real*8 STATENEW(nangmax,NSTATEV)
	  !real*8 defgradNew(nangmax,9)
	  !real*8 defgradOld(nangmax,9)
	  !real*8 Dissipation(nangmax)
	  real*8 work
	  real*8 totweight
	  real*8 sigma(6)
!-----------------------------------------------------------------------
!     Define some parameters
!-----------------------------------------------------------------------
!
!-----------------------------------------------------------------------
!     Define material properties
!-----------------------------------------------------------------------
	  call readprops(props,nprops)			! Read material properties and stuff...
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
	  totweight = 0.d0
	  do i=1,nblock
		totweight = totweight + ang(i,4)
	  enddo
!-----------------------------------------------------------------------
!     Define loading
!-----------------------------------------------------------------------
      call deformation(props,nprops,Dij,nDmax,ndef)
c
      NITER  = 1000001 ! Max number of iterations
c
      DT     = props(205)/(props(204)*props(6)*3.d3) ! dt=wp/(M*Niter*tauc_0*epsdot) (M=3,Niter=1000)
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
      TIME = 0.d0
	  work = 0.d0
c
      do i=1,nblock
		do k=1,6
			STRESSOLD(i,k) = 0.d0
			STRESSNEW(i,k) = 0.d0
		enddo
	  enddo
c
      do i=1,nblock
		do k=1,NSTATEV
			STATEOLD(i,k) = 0.d0
			STATENEW(i,k) = 0.d0
		enddo
	  enddo
	  do i=1,nblock
		STATEOLD(i,1) = ang(i,1)
		STATEOLD(i,2) = ang(i,2)
		STATEOLD(i,3) = ang(i,3)
	  enddo
	  
	  do i=1,nblock
		do k=1,3
			defgradOld(i,k) = 1.d0
			defgradNew(i,k) = 1.d0
		enddo
		do k=4,9
			defgradOld(i,k) = 0.d0
			defgradNew(i,k) = 0.d0
		enddo
	  enddo
!-----------------------------------------------------------------------
!     Start loop
!-----------------------------------------------------------------------
      do ITER=1,NITER
!         print*,'ITER = ',ITER
!-----------------------------------------------------------------------
!        Extract strain increments 
!-----------------------------------------------------------------------
         if(time.gt.0.0)then
c
            do i=1,nblock
				defgradNew(i,1) = defgradOld(i,1)*(Dij(km,1)*dt+1.0)
     +           +defgradOld(i,7)*Dij(km,4)*dt
     +           +defgradOld(i,6)*Dij(km,6)*dt
				defgradNew(i,2) = defgradOld(i,2)*(Dij(km,2)*dt+1.0)
     +           +defgradOld(i,4)*Dij(km,4)*dt
     +           +defgradOld(i,8)*Dij(km,5)*dt
				defgradNew(i,3) = defgradOld(i,3)*(Dij(km,3)*dt+1.0)
     +           +defgradOld(i,9)*Dij(km,6)*dt
     +           +defgradOld(i,5)*Dij(km,5)*dt
				defgradNew(i,4) = defgradOld(i,4)*(Dij(km,1)*dt+1.0)
     +           +defgradOld(i,2)*Dij(km,4)*dt
     +           +defgradOld(i,8)*Dij(km,6)*dt
				defgradNew(i,5) = defgradOld(i,5)*(Dij(km,2)*dt+1.0)
     +           +defgradOld(i,9)*Dij(km,4)*dt
     +           +defgradOld(i,3)*Dij(km,5)*dt
				defgradNew(i,6) = defgradOld(i,6)*(Dij(km,3)*dt+1.0)
     +           +defgradOld(i,1)*Dij(km,6)*dt
     +           +defgradOld(i,7)*Dij(km,5)*dt
				defgradNew(i,7) = defgradOld(i,7)*(Dij(km,2)*dt+1.0)
     +           +defgradOld(i,1)*Dij(km,4)*dt
     +           +defgradOld(i,6)*Dij(km,5)*dt
				defgradNew(i,8) = defgradOld(i,8)*(Dij(km,3)*dt+1.0)
     +           +defgradOld(i,4)*Dij(km,6)*dt
     +           +defgradOld(i,2)*Dij(km,5)*dt
				defgradNew(i,9) = defgradOld(i,9)*(Dij(km,1)*dt+1.0)
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
!        OUTPUT VARIABLES
!-----------------------------------------------------------------------
!         WRITE(2,98) time,STRESSNEW(1),STRESSNEW(2),STRESSNEW(3),
!     .                    STRESSNEW(4),STRESSNEW(5),STRESSNEW(6),
!     .                    strain(1),strain(2),strain(3),
!     .                    strain(4),strain(5),strain(6),
!     .                    STATENEW(1),STATENEW(2),STATENEW(3),
!     .                    STATENEW(4),STATENEW(5),STATENEW(6),
!     .                    STATENEW(7),STATENEW(8),STATENEW(9),
!     .                    STATENEW(10),STATENEW(11),STATENEW(12),
!     .                    STATENEW(13),STATENEW(14),STATENEW(15),
!     .                    STATENEW(16),STATENEW(17),STATENEW(18),
!     .                    STATENEW(19),STATENEW(20),STATENEW(21),
!     .                    STATENEW(22),STATENEW(23),STATENEW(24),
!     .                    STATENEW(25),STATENEW(26),STATENEW(27),
!     .                    STATENEW(28)
!-----------------------------------------------------------------------
!        UPDATE TIME
!-----------------------------------------------------------------------
         TIME = TIME+DT
!-----------------------------------------------------------------------
!        UPDATE VARIABLES FOR NEXT TIME STEP
!-----------------------------------------------------------------------
         do i=1,nblock
			do k=1,6
				STRESSOLD(i,k) = STRESSNEW(i,k)
			enddo
		 enddo
		 do i=1,nblock
			do k=1,NSTATEV
				STATEOLD(i,k) = STATENEW(i,k)
			enddo
		 enddo
		 do i=1,nblock
			do k=1,9
				defgradOld(i,k) = defgradNew(i,k)
			enddo
		 enddo
		 do i=1,nblock
			work = work + Dissipation(i)*ang(i,4)/totweight
		 enddo
		 sigma =0.d0
		 do i=1,nblock
			sigma(1) = sigma(1)+STRESSNEW(i,1)*ang(i,4)/totweight
			sigma(2) = sigma(2)+STRESSNEW(i,2)*ang(i,4)/totweight
			sigma(3) = sigma(3)+STRESSNEW(i,3)*ang(i,4)/totweight
			sigma(4) = sigma(4)+STRESSNEW(i,4)*ang(i,4)/totweight
			sigma(5) = sigma(5)+STRESSNEW(i,5)*ang(i,4)/totweight
			sigma(6) = sigma(6)+STRESSNEW(i,6)*ang(i,4)/totweight
		 enddo
		 if (work.ge.props(205)) then
			sigma(1)=sigma(1)-sigma(3)	! Superpose a hydrostatic stress so that s33=0
			sigma(2)=sigma(2)-sigma(3)	! Yielding is not dependent upon hydrostatic stress!
			sigma(3)=sigma(3)-sigma(3)
			write(2,98) sigma(1),sigma(2),sigma(3),sigma(4),
     +                  sigma(5),sigma(6), work
			goto 12
		 endif
		 if (ITER.ge.NITER) then
			write(6,*) '!! Error'
			write(6,*) 'Maximum number of iterations reached'
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

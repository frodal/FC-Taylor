!-----------------------------------------------------------------------
!     For gfortran, compile the program with -fopenmp 
!     For ifort, compile the program with -openmp
!     Remember to increase the Stack size with -Fn where n is the 
!     number of bytes, e.g., 
!     ifort -openmp -F1000000000 main.f -o ./GUI/Core/FC-Taylor.exe -O3
!     Note that lines starting with !$ are compiler directives
!     for using, e.g., OpenMP, i.e., multi-threading
!-----------------------------------------------------------------------
!     Subroutines
!-----------------------------------------------------------------------
#include '../../Dependencies/SCMM-hypo/Hypo.f'
#include '../../Dependencies/SCMM-hypo/Subs.f'
      include './readprops.f'
      include './readeuler.f'
      include './deformation.f'
      include './uniaxialtension.f'
!-----------------------------------------------------------------------
!     FC-Taylor program
!-----------------------------------------------------------------------
      program FCTaylor
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      real*8, allocatable :: ang(:,:), STRESSOLD(:,:), STRESSNEW(:,:),
     .                  STATEOLD(:,:), STATENEW(:,:), defgradNew(:,:),
     .                  defgradOld(:,:), Dissipation(:), Dij(:,:),
     .                  sigma(:,:)
      real*8 sigmaUT(7)
      integer nDmax,nprops, iComplete
      integer k,ITER,ndef,i,km,planestress,centro,npts,ncpus
      integer NITER,NSTATEV,nblock,Nang, UTflag
      integer OMP_get_thread_num
      parameter(nprops=16,NSTATEV=28)
      real*8 epsdot,wp
      CHARACTER*12 DATE1,TIME1
!-----------------------------------------------------------------------
      real*8 printDelay,currentTime,printTime
      real*8 DT
      real*8 PROPS(nprops)
      real*8 work
      real*8 totweight
      real*8 one,zero
      parameter(zero=0.d0,one=1.d0,printDelay=5.d0*60.d0)
!-----------------------------------------------------------------------
!     Define some parameters
!-----------------------------------------------------------------------
      UTflag = 0
!-----------------------------------------------------------------------
!     Define material properties
!-----------------------------------------------------------------------
      call readprops(props,nprops,planestress,centro,npts,epsdot,wp,
     &               ncpus)     ! Read material properties and stuff...
      call readuniqueeulerlength(nblock,Nang)
!-----------------------------------------------------------------------
      allocate(ang(nblock,4))
      allocate(STRESSOLD(nblock,6))
      allocate(STRESSNEW(nblock,6))
      allocate(STATEOLD(nblock,NSTATEV))
      allocate(STATENEW(nblock,NSTATEV))
      allocate(defgradNew(nblock,9))
      allocate(defgradOld(nblock,9))
      allocate(Dissipation(nblock))
!-----------------------------------------------------------------------
      ! Read Euler angles and weights
      call readuniqueeuler(ang,nblock,Nang)
!-----------------------------------------------------------------------
      totweight = zero
      do i=1,nblock
        totweight = totweight + ang(i,4)
      enddo
      do i=1,nblock
        ang(i,4) = ang(i,4)/totweight
      enddo
!-----------------------------------------------------------------------
!     Define loading
!-----------------------------------------------------------------------
      if (planestress.eq.1) then
        nDmax = 6*(npts-2)**2 + 12*(npts-2) + 8
      else
        nDmax = 10*(npts-2)**4 + 40*(npts-2)**3 +
     +  80*(npts-2)**2 + 80*(npts-2) + 32
      endif
!-----------------------------------------------------------------------
      call deformationPoints(nDmax,ndef,planestress,centro,npts,epsdot)
      allocate(Dij(ndef,6))
!-----------------------------------------------------------------------
      call deformation(Dij,nDmax,ndef,planestress,centro,npts,epsdot)
!-----------------------------------------------------------------------
      allocate(sigma(ndef,7))
!-----------------------------------------------------------------------
      sigma = zero
      iComplete = 0
!-----------------------------------------------------------------------
      NITER  = 10001 ! Max number of iterations
!-----------------------------------------------------------------------
      ! dt=(we+wp)/(M*Niter*tauc_0*epsdot) (M=3,Niter=1000)
      DT     = (9*props(6)**2/props(1)+wp)/(epsdot*props(6)*3.d3)
!-----------------------------------------------------------------------
!     Write the start date and time
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
!$    call OMP_set_num_threads(ncpus)
#ifdef __INTEL_COMPILER
!$    call kmp_set_stacksize(1000000000)
#endif
!$OMP PARALLEL DO DEFAULT(SHARED) PRIVATE(work,km,STRESSOLD,stressNew
!$OMP& ,STATEOLD,stateNew,i,k,defgradOld,defgradNew,iter,Dissipation)
      do km=1,ndef
!-----------------------------------------------------------------------
!     Calculates the uniaxial stress point along RD
!-----------------------------------------------------------------------
      if((UTflag.eq.0).and.(OMP_get_thread_num().eq.0))then
        UTflag = 1
        call uniaxialTension(nblock,nstatev,nprops,niter,
     .                       ang,props,dt,wp,epsdot,sigmaUT)
        ! Superpose a hydrostatic stress so that s33=0
        ! Yielding is not dependent upon hydrostatic stress!
        sigmaUT(1) = sigmaUT(1)-sigmaUT(3)
        sigmaUT(2) = sigmaUT(2)-sigmaUT(3)
        sigmaUT(3) = sigmaUT(3)-sigmaUT(3)
      endif
!-----------------------------------------------------------------------
!     Initialize some variables
!-----------------------------------------------------------------------
      work = zero
      STRESSOLD = zero
!-----------------------------------------------------------------------
      do i=1,nblock
        STATEOLD(i,1) = ang(i,1)
        STATEOLD(i,2) = ang(i,2)
        STATEOLD(i,3) = ang(i,3)
      enddo
      do k=4,NSTATEV
        do i=1,nblock
            STATEOLD(i,k) = zero
        enddo
      enddo
!-----------------------------------------------------------------------
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
         !DIR$ FORCEINLINE RECURSIVE
         CALL Hypo(stressNew,stateNew,defgradNew,
     +               stressOld,stateOld,defgradOld,dt,props,
     +               nblock,nstatev,nprops,Dissipation)
!-----------------------------------------------------------------------
!        UPDATE VARIABLES FOR NEXT TIME STEP
!-----------------------------------------------------------------------
         STRESSOLD = STRESSNEW
         STATEOLD = STATENEW
         defgradOld = defgradNew
         do i=1,nblock
            work = work + Dissipation(i)*ang(i,4)
         enddo
      enddo
      if (work.ge.wp) then
!-----------------------------------------------------------------------
!     Write to window if enough time has passed
!-----------------------------------------------------------------------
!$OMP CRITICAL
        call cpu_time(currentTime)
        if((currentTime.ge.(printTime+printDelay*real(ncpus))).or.
     .      (iComplete+1.eq.ndef))then
            printTime = printTime+printDelay*real(ncpus)
            write(6,*) 'Deformation points completed: ',
     .                  iComplete+1, ' of ', ndef
        endif
!-----------------------------------------------------------------------
!     Calculate stress based on the Taylor hypothesis
!-----------------------------------------------------------------------
        iComplete = iComplete+1
        do i=1,nblock
            sigma(km,1) = sigma(km,1)+STRESSNEW(i,1)*ang(i,4)
            sigma(km,2) = sigma(km,2)+STRESSNEW(i,2)*ang(i,4)
            sigma(km,3) = sigma(km,3)+STRESSNEW(i,3)*ang(i,4)
            sigma(km,4) = sigma(km,4)+STRESSNEW(i,4)*ang(i,4)
            sigma(km,5) = sigma(km,5)+STRESSNEW(i,5)*ang(i,4)
            sigma(km,6) = sigma(km,6)+STRESSNEW(i,6)*ang(i,4)
        enddo
        ! Superpose a hydrostatic stress so that s33=0
        ! Yielding is not dependent upon hydrostatic stress!
        sigma(km,1) = sigma(km,1)-sigma(km,3)
        sigma(km,2) = sigma(km,2)-sigma(km,3)
        sigma(km,3) = sigma(km,3)-sigma(km,3)
        sigma(km,7) = work
!$OMP END CRITICAL
      elseif (ITER.ge.NITER) then
        write(6,*) '!! Error'
        write(6,*) 'Maximum number of iterations reached'
        call sleep(1)
        error stop 'Error code: 11'
      endif
      enddo
!$OMP END PARALLEL DO
!-----------------------------------------------------------------------
!     Write the result to file
!-----------------------------------------------------------------------
      open (unit = 2, file = "./Output/output.txt")
      write(2,*) 'S11, S22, S33, S12, S23, S31, wp'
      if (centro.eq.1)then
        write(2,98) sigmaUT(1),sigmaUT(2),sigmaUT(3),sigmaUT(4),
     +              sigmaUT(5),sigmaUT(6), sigmaUT(7)
        write(2,98) -sigmaUT(1),-sigmaUT(2),-sigmaUT(3),-sigmaUT(4),
     +              -sigmaUT(5),-sigmaUT(6), sigmaUT(7)
        do km=1,ndef
          write(2,98) sigma(km,1),sigma(km,2),sigma(km,3),sigma(km,4),
     +                sigma(km,5),sigma(km,6), sigma(km,7)
          write(2,98) -sigma(km,1),-sigma(km,2),-sigma(km,3),
     +                -sigma(km,4),-sigma(km,5),-sigma(km,6), 
     +                 sigma(km,7)
        enddo
      else
        write(2,98) sigmaUT(1),sigmaUT(2),sigmaUT(3),sigmaUT(4),
     +              sigmaUT(5),sigmaUT(6), sigmaUT(7)
        do km=1,ndef
          write(2,98) sigma(km,1),sigma(km,2),sigma(km,3),sigma(km,4),
     +                sigma(km,5),sigma(km,6), sigma(km,7)
        enddo
      endif
      close(2)
!-----------------------------------------------------------------------
!     Write the finish date and time
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
      call DATE_AND_TIME(DATE1,TIME1)
      write(6,*)'Finished: ',DATE1(7:8),'.',DATE1(5:6),'.',
     &           DATE1(1:4),' at ',TIME1(1:2),':',TIME1(3:4),':',
     &           TIME1(5:6)
      write(6,*) '----------------------------------------------------'
!-----------------------------------------------------------------------
!     Deallocate allocated memory
!-----------------------------------------------------------------------
      if(allocated(ang)) deallocate(ang)
      if(allocated(STRESSOLD)) deallocate(STRESSOLD)
      if(allocated(STRESSNEW)) deallocate(STRESSNEW)
      if(allocated(STATEOLD)) deallocate(STATEOLD)
      if(allocated(STATENEW)) deallocate(STATENEW)
      if(allocated(defgradNew)) deallocate(defgradNew)
      if(allocated(defgradOld)) deallocate(defgradOld)
      if(allocated(Dissipation)) deallocate(Dissipation)
      if(allocated(Dij)) deallocate(Dij)
      if(allocated(sigma)) deallocate(sigma)
!-----------------------------------------------------------------------
!     END PROGRAM
!-----------------------------------------------------------------------
   98 format(es15.6e3,',',es15.6e3,',',es15.6e3,',',es15.6e3,
     +              ',',es15.6e3,',',es15.6e3,',',es15.6e3)
      end
!-----------------------------------------------------------------------
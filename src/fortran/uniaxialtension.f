!-----------------------------------------------------------------------
!                         SUBROUTINE uniaxialTension
!-----------------------------------------------------------------------
!  
! 
!-----------------------------------------------------------------------
      subroutine uniaxialTension(nblock,nstatev,nprops,niter,
     .                           ang,props,dt,wp,epsdot,sigma)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: nblock, nstatev, nprops, niter
      real*8, intent(in) :: ang(nblock,4), props(nprops), dt, wp,
     .                      epsdot
      real*8, intent(out) :: sigma(7)
!     Local variables
      real*8 work, stressold(nblock,6), stateold(nblock,nstatev),
     .       defgradold(nblock,9), defgradNew(nblock,9), 
     .       stressNew(nblock,6), stateNew(nblock,nstatev),
     .       Dissipation(nblock), D(6)
      real*8 zero, one
      integer i, k, iter
      parameter(zero=0.d0, one=1.d0)
!-----------------------------------------------------------------------
!     Initialize some variables
!-----------------------------------------------------------------------
      work = zero
      stressold = zero
!-----------------------------------------------------------------------
      do i=1,nblock
        stateold(i,1) = ang(i,1)
        stateold(i,2) = ang(i,2)
        stateold(i,3) = ang(i,3)
      enddo
      do k=4,nstatev
        do i=1,nblock
            stateold(i,k) = zero
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
      D(1) = epsdot
      D(2) = zero
      D(3) = zero
      D(4) = zero
      D(5) = zero
      D(6) = zero
!-----------------------------------------------------------------------
!     Start deformation loop
!-----------------------------------------------------------------------
      iter = 0
      do while((work.lt.wp).and.(ITER.lt.NITER))
        iter = iter+1
!-----------------------------------------------------------------------
!        CALL Taylor
!-----------------------------------------------------------------------
!DIR$ FORCEINLINE RECURSIVE
        call Taylor(nblock,nstatev,nprops,
     .              ang,props,dt,D,stressOld,stateOld
     .              defgradOld,stressNew,stateNew,defgradNew,sigma)
!DIR$ FORCEINLINE RECURSIVE
        call TaylorCTO(nblock,nstatev,nprops,
     .                 ang,props,dt,D,stressOld,stateOld
     .                 defgradOld,ddsdde)
        call inverse(ddsdde,ddedds,6)
        do i=1,6
            D(i) = ddedds(i,1)
        enddo
!-----------------------------------------------------------------------
!        UPDATE VARIABLES FOR NEXT TIME STEP
!-----------------------------------------------------------------------
        stressOld  = stressNew
        stateOld   = stateNew
        defgradOld = defgradNew
        work = work+sigma(7)
      enddo
      if (iter.ge.niter) then
        write(6,*) '!! Error'
        write(6,*) 'Maximum number of iterations reached'
        call sleep(1)
        error stop 'Error code: 11'
      endif
!-----------------------------------------------------------------------
      return
      end subroutine uniaxialTension
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!                         SUBROUTINE Taylor
!-----------------------------------------------------------------------
!  
! 
!-----------------------------------------------------------------------
      subroutine Taylor(nblock,nstatev,nprops,
     .                  ang,props,dt,D,stressOld,stateOld
     .                  defgradOld,stressNew,stateNew,defgradNew,sigma)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: nblock, nstatev, nprops,
      real*8, intent(in) :: ang(nblock,4), props(nprops), dt, D(6),
     .       stressOld(nblock,6), stateOld(nblock,nstatev),
     .       defgradOld(nblock,9)
      real*8, intent(out) :: stressNew(nblock,6), sigma(7),
     .       stateNew(nblock,nstatev), defgradNew(nblock,9)
!     Local variables
      real*8 Dissipation(nblock)
      real*8 zero, one
      integer i, k, iter
      parameter(zero=0.d0, one=1.d0)
!-----------------------------------------------------------------------
!     Initialize some variables
!-----------------------------------------------------------------------
      Dissipation = zero
      sigma = zero
!-----------------------------------------------------------------------
!        Create deformation gradient based on the rate of deformation
!-----------------------------------------------------------------------
         do i=1,nblock
            defgradNew(i,1) = defgradOld(i,1)*(D(1)*dt+one)
     +           +defgradOld(i,7)*D(4)*dt
     +           +defgradOld(i,6)*D(6)*dt
            defgradNew(i,2) = defgradOld(i,2)*(D(2)*dt+one)
     +           +defgradOld(i,4)*D(4)*dt
     +           +defgradOld(i,8)*D(5)*dt
            defgradNew(i,3) = defgradOld(i,3)*(D(3)*dt+one)
     +           +defgradOld(i,9)*D(6)*dt
     +           +defgradOld(i,5)*D(5)*dt
            defgradNew(i,4) = defgradOld(i,4)*(D(1)*dt+one)
     +           +defgradOld(i,2)*D(4)*dt
     +           +defgradOld(i,8)*D(6)*dt
            defgradNew(i,5) = defgradOld(i,5)*(D(2)*dt+one)
     +           +defgradOld(i,9)*D(4)*dt
     +           +defgradOld(i,3)*D(5)*dt
            defgradNew(i,6) = defgradOld(i,6)*(D(3)*dt+one)
     +           +defgradOld(i,1)*D(6)*dt
     +           +defgradOld(i,7)*D(5)*dt
            defgradNew(i,7) = defgradOld(i,7)*(D(2)*dt+one)
     +           +defgradOld(i,1)*D(4)*dt
     +           +defgradOld(i,6)*D(5)*dt
            defgradNew(i,8) = defgradOld(i,8)*(D(3)*dt+one)
     +           +defgradOld(i,4)*D(6)*dt
     +           +defgradOld(i,2)*D(5)*dt
            defgradNew(i,9) = defgradOld(i,9)*(D(1)*dt+one)
     +           +defgradOld(i,5)*D(4)*dt
     +           +defgradOld(i,3)*D(6)*dt
         enddo
!-----------------------------------------------------------------------
!        CALL UMAT
!-----------------------------------------------------------------------
      CALL Hypo(stressNew,stateNew,defgradNew,
     +          stressOld,stateOld,defgradOld,dt,props,
     +          nblock,nstatev,nprops,Dissipation)
!-----------------------------------------------------------------------
!     Calculate stress based on the Taylor hypothesis
!-----------------------------------------------------------------------
      do i=1,nblock
          sigma(1) = sigma(1)+stressNew(i,1)*ang(i,4)
          sigma(2) = sigma(2)+stressNew(i,2)*ang(i,4)
          sigma(3) = sigma(3)+stressNew(i,3)*ang(i,4)
          sigma(4) = sigma(4)+stressNew(i,4)*ang(i,4)
          sigma(5) = sigma(5)+stressNew(i,5)*ang(i,4)
          sigma(6) = sigma(6)+stressNew(i,6)*ang(i,4)
      enddo
      do i=1,nblock
        sigma(7) = sigma(7) + Dissipation(i)*ang(i,4)
      enddo
!-----------------------------------------------------------------------
      return
      end subroutine Taylor
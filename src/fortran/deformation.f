!-----------------------------------------------------------------------
!                         SUBROUTINE deformation
!-----------------------------------------------------------------------
!  
! 
!-----------------------------------------------------------------------
      subroutine deformation(D,nDmax,ndef,planestress,centro,npts,
     +                       epsdot)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: nDmax,ndef,planestress,npts,centro
      real*8, intent(in) :: epsdot
      real*8, intent(out) :: D(ndef,6)
!     Local variables
      real*8 Dp(nDmax,5),temp
      integer k,i
!-----------------------------------------------------------------------
!         Deformation properties
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!         Deformation to be used
!-----------------------------------------------------------------------
      if (planestress.eq.1) then
        call generatestrainrate2d(Dp,nDmax,npts)
      else
        call generatestrainrate3d(Dp,nDmax,npts)
      endif
!-----------------------------------------------------------------------
      if(centro.eq.1)then
        i = 0
        do k=1,nDmax
        temp=epsdot*((3.0**0.5+3.0)*Dp(k,1)/6.0+
     +               (3.0**0.5-3.0)*Dp(k,2)/6.0)    ! D11
        if(temp.ge.0d0)then
        i=i+1
        D(i,1) = epsdot*((3.0**0.5+3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5-3.0)*Dp(k,2)/6.0)! D11
        D(i,2) = epsdot*((3.0**0.5-3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5+3.0)*Dp(k,2)/6.0)! D22
        D(i,3) = epsdot*(-sqrt(3.0)*Dp(k,1)/3.0-sqrt(3.0)*Dp(k,2)/3.0)
        ! D33
        D(i,4) = epsdot*sqrt(2.0)*Dp(k,3)/2.0! D12
        D(i,5) = epsdot*sqrt(2.0)*Dp(k,4)/2.0! D23
        D(i,6) = epsdot*sqrt(2.0)*Dp(k,5)/2.0! D31
        endif
        enddo
      else
      do k=1,nDmax
        D(k,1) = epsdot*((3.0**0.5+3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5-3.0)*Dp(k,2)/6.0)! D11
        D(k,2) = epsdot*((3.0**0.5-3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5+3.0)*Dp(k,2)/6.0)! D22
        D(k,3) = epsdot*(-sqrt(3.0)*Dp(k,1)/3.0-sqrt(3.0)*Dp(k,2)/3.0)
        ! D33
        D(k,4) = epsdot*sqrt(2.0)*Dp(k,3)/2.0! D12
        D(k,5) = epsdot*sqrt(2.0)*Dp(k,4)/2.0! D23
        D(k,6) = epsdot*sqrt(2.0)*Dp(k,5)/2.0! D31
      enddo
      endif
!-----------------------------------------------------------------------
!         Write information
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
      write(6,*) 'Number of generated strain rate points:',ndef
      write(6,*) '----------------------------------------------------'
!-----------------------------------------------------------------------
      return
      end subroutine deformation
!
!-----------------------------------------------------------------------
!                         SUBROUTINE generatestrainrate2d
!-----------------------------------------------------------------------
! 
! 
!-----------------------------------------------------------------------
      subroutine generatestrainrate2d(Dp,nDmax,npts)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: npts,nDmax
      real*8, intent(out) :: Dp(nDmax,5)
      integer i,j,k,ii
      real*8 d1,d2,d3,vec(npts)
!-----------------------------------------------------------------------
      call linspace(-1.d0,1.d0,npts,vec)
      ii = 0
      do i=1,npts
        do j=1,npts
          do k=1,npts
            d1 = vec(i)
            d2 = vec(j)
            d3 = vec(k)
            if ((abs(d1).eq.1.d0).or.
     .          (abs(d2).eq.1.d0).or.
     .          (abs(d3).eq.1.d0)) then
              ii       = ii+1
              Dp(ii,1) = d1/(d1**2+d2**2+d3**2)**0.5
              Dp(ii,2) = d2/(d1**2+d2**2+d3**2)**0.5
              Dp(ii,3) = d3/(d1**2+d2**2+d3**2)**0.5
              Dp(ii,4) = 0.d0
              Dp(ii,5) = 0.d0
            endif
          enddo
        enddo
      enddo
!-----------------------------------------------------------------------
      return
      end subroutine generatestrainrate2d
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!                         SUBROUTINE generatestrainrate3d
!-----------------------------------------------------------------------
! 
! 
!-----------------------------------------------------------------------
      subroutine generatestrainrate3d(Dp,nDmax,npts)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: npts,nDmax
      real*8, intent(out) :: Dp(nDmax,5)
      integer i,j,k,l,m,ii
      real*8 d1,d2,d3,d4,d5,vec(npts)
!-----------------------------------------------------------------------
      call linspace(-1.d0,1.d0,npts,vec)
      ii = 0
      do i=1,npts
        do j=1,npts
          do k=1,npts
            do l=1,npts
              do m=1,npts
                d1 = vec(i)
                d2 = vec(j)
                d3 = vec(k)
                d4 = vec(l)
                d5 = vec(m)
                if ((abs(d1).eq.1.d0).or.
     .              (abs(d2).eq.1.d0).or.
     .              (abs(d3).eq.1.d0).or.
     .              (abs(d4).eq.1.d0).or.
     .              (abs(d5).eq.1.d0)) then
                ii       = ii+1
                Dp(ii,1) = d1/(d1**2+d2**2+d3**2+d4**2+d5**2)**0.5
                Dp(ii,2) = d2/(d1**2+d2**2+d3**2+d4**2+d5**2)**0.5
                Dp(ii,3) = d3/(d1**2+d2**2+d3**2+d4**2+d5**2)**0.5
                Dp(ii,4) = d4/(d1**2+d2**2+d3**2+d4**2+d5**2)**0.5
                Dp(ii,5) = d5/(d1**2+d2**2+d3**2+d4**2+d5**2)**0.5
                endif
              enddo
            enddo
          enddo
        enddo
      enddo
!-----------------------------------------------------------------------
      return
      end subroutine generatestrainrate3d
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!                         SUBROUTINE linspace
!-----------------------------------------------------------------------
! 
! 
!-----------------------------------------------------------------------
      subroutine linspace(d1,d2,n,grid)
!-----------------------------------------------------------------------
      implicit none
!-----------------------------------------------------------------------
      integer, intent(in) :: n
      double precision, intent(in) :: d1, d2
      double precision, dimension(n), intent(out) :: grid
      integer :: indxi
!-----------------------------------------------------------------------
      grid(1) = d1
      do indxi= 0,n-2
        grid(indxi+1) = d1+(DBLE(indxi)*(d2-d1))/DBLE(n-1)
      enddo
      grid(n) = d2
!-----------------------------------------------------------------------
      return
      end subroutine
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!                         SUBROUTINE deformationPoints
!-----------------------------------------------------------------------
! 
! 
!-----------------------------------------------------------------------
      subroutine deformationPoints(nDmax,ndef,planestress,centro,npts,
     +                             epsdot)
!-----------------------------------------------------------------------
      implicit none
      integer, intent(in) :: nDmax,planestress,npts,centro
      integer, intent(out) :: ndef
      real*8, intent(in) :: epsdot
!     Local variables
      real*8 Dp(nDmax,5),temp
      integer k
!-----------------------------------------------------------------------
!         Deformation properties
!-----------------------------------------------------------------------
!-----------------------------------------------------------------------
!         Deformation to be used
!-----------------------------------------------------------------------
      if (planestress.eq.1) then
        call generatestrainrate2d(Dp,nDmax,npts)
      else
        call generatestrainrate3d(Dp,nDmax,npts)
      endif
!-----------------------------------------------------------------------
      if(centro.eq.1)then
        ndef = 0
        do k=1,nDmax
        temp=epsdot*((3.0**0.5+3.0)*Dp(k,1)/6.0+
     +               (3.0**0.5-3.0)*Dp(k,2)/6.0)    ! D11
        if(temp.ge.0d0)then
          ndef=ndef+1
        endif
        enddo
      else
        ndef = nDmax
      endif
!-----------------------------------------------------------------------
      return
      end subroutine deformationPoints
!-----------------------------------------------------------------------
!                         SUBROUTINE deformation
!-----------------------------------------------------------------------
! 
! 
!-----------------------------------------------------------------------
      subroutine deformation(props,nprops,D,nDmax,i)
!
      implicit none
!
      integer, intent(in) :: nprops,nDmax
	  real*8, intent(in) :: props(nprops)
	  real*8, intent(out) :: D(nDmax,6)
	  integer, intent(out) :: i
!     Local variables
      real*8 epsdot,Dp(nDmax,5),temp
	  integer planestress,centro,npts,k,n
!-----------------------------------------------------------------------
!         Deformation properties
!-----------------------------------------------------------------------
	  planestress = int(props(201))
	  centro = int(props(202))
	  npts = int(props(203))
	  epsdot = props(204)
	  if (planestress.eq.1) then
		n = 6*(npts-2)**2 + 12*(npts-2) + 8
	  else
		n = 10*(npts-2)**4 + 40*(npts-2)**3 +
     +  80*(npts-2)**2 + 80*(npts-2) + 32
	   endif
	   if (n.gt.nDmax) then
		write(6,*) '!! Error'
		write(6,*) 'Too many stress points selected'
		write(6,*) 'Number of stress points slected : ',n
		write(6,*) 'Please use less than or equal to: ',nDmax
		stop
	  endif
!-----------------------------------------------------------------------
!         Deformation to be used
!-----------------------------------------------------------------------
	  if (planestress.eq.1) then
		call generatestrainrate2d(Dp,nDmax,npts)
	  else
		call generatestrainrate3d(Dp,nDmax,npts)
	  endif
!
	  if(centro.eq.1)then
		i = 0
		do k=1,n
		temp=epsdot*((3.0**0.5+3.0)*Dp(k,1)/6.0+
     +               (3.0**0.5-3.0)*Dp(k,2)/6.0)    ! D11
		if(temp.ge.0d0)then
		i=i+1
		D(i,1) = epsdot*((3.0**0.5+3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5-3.0)*Dp(k,2)/6.0)! D11
		D(i,2) = epsdot*((3.0**0.5-3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5+3.0)*Dp(k,2)/6.0)! D22
		D(i,3) = epsdot*(-sqrt(3.0)*Dp(k,1)/3.0-sqrt(3.0)*Dp(k,2)/3.0)! D33
		D(i,4) = epsdot*sqrt(2.0)*Dp(k,3)/2.0! D12
		D(i,5) = epsdot*sqrt(2.0)*Dp(k,4)/2.0! D23
		D(i,6) = epsdot*sqrt(2.0)*Dp(k,5)/2.0! D31
		endif
		enddo
	  else
	  do k=1,n
		D(k,1) = epsdot*((3.0**0.5+3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5-3.0)*Dp(k,2)/6.0)! D11
		D(k,2) = epsdot*((3.0**0.5-3.0)*Dp(k,1)/6.0+
     +                   (3.0**0.5+3.0)*Dp(k,2)/6.0)! D22
		D(k,3) = epsdot*(-sqrt(3.0)*Dp(k,1)/3.0-sqrt(3.0)*Dp(k,2)/3.0)! D33
		D(k,4) = epsdot*sqrt(2.0)*Dp(k,3)/2.0! D12
		D(k,5) = epsdot*sqrt(2.0)*Dp(k,4)/2.0! D23
		D(k,6) = epsdot*sqrt(2.0)*Dp(k,5)/2.0! D31
	  enddo
	  i = n
	  endif
!-----------------------------------------------------------------------
!         Write information
!-----------------------------------------------------------------------
      write(6,*) '----------------------------------------------------'
	  write(6,*) 'Number of generated strain rate points: ',i
      write(6,*) '----------------------------------------------------'
!
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
	  !
	  implicit none
	  !
	  integer, intent(in) :: npts,nDmax
	  real*8, intent(out) :: Dp(nDmax,5)
	  integer i,j,k,ii
	  real*8 d1,d2,d3,vec(npts)
	  !
	  call linspace(-1.d0,1.d0,npts,vec)
	  ii = 0
	  do i=1,npts
		do j=1,npts
			do k=1,npts
				d1 = vec(i)
				d2 = vec(j)
				d3 = vec(k)
				if ((abs(d1).eq.1.d0).or.
     .              (abs(d2).eq.1.d0).or.
     .              (abs(d3).eq.1.d0)) then
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
!
	  return
	  end subroutine generatestrainrate2d
!
!-----------------------------------------------------------------------
!                         SUBROUTINE generatestrainrate3d
!-----------------------------------------------------------------------
! 
! 
!-----------------------------------------------------------------------
	  subroutine generatestrainrate3d(Dp,nDmax,npts)
	  !
	  implicit none
	  !
	  integer, intent(in) :: npts,nDmax
	  real*8, intent(out) :: Dp(nDmax,5)
	  integer i,j,k,l,m,ii
	  real*8 d1,d2,d3,d4,d5,vec(npts)
	  !
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
     .                      (abs(d2).eq.1.d0).or.
     .                      (abs(d3).eq.1.d0).or.
     .                      (abs(d4).eq.1.d0).or.
     .                      (abs(d5).eq.1.d0)) then
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
!
	  return
	  end subroutine generatestrainrate3d
!
!-----------------------------------------------------------------------
!                         SUBROUTINE linspace
!-----------------------------------------------------------------------
! 
! 
!-----------------------------------------------------------------------
	  SUBROUTINE linspace(d1,d2,n,grid)

	  IMPLICIT NONE

	  INTEGER, INTENT(IN) :: n
	  DOUBLE PRECISION, INTENT(IN) :: d1, d2
	  DOUBLE PRECISION, DIMENSION(n), INTENT(OUT) :: grid

	  INTEGER :: indxi


	  grid(1) = d1
	  DO indxi= 0,n-2
		grid(indxi+1) = d1+(DBLE(indxi)*(d2-d1))/DBLE(n-1)
	  END DO
	  grid(n) = d2
	  return
	  END SUBROUTINE
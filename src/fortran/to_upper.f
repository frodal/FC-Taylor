!-----------------------------------------------------------------------
!                         FUNCTION to_upper
!-----------------------------------------------------------------------
! Changes a string to upper case
! 
!-----------------------------------------------------------------------
      Pure Function to_upper(str) Result (string)
!-----------------------------------------------------------------------
      Implicit None
!-----------------------------------------------------------------------
      Character(*), Intent(In) :: str
      Character(LEN(str))      :: string
!     Local variables
      Integer :: ic, i
      Character(26), Parameter :: cap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      Character(26), Parameter :: low = 'abcdefghijklmnopqrstuvwxyz'
!-----------------------------------------------------------------------
!     Capitalize each letter if it is lowecase
!-----------------------------------------------------------------------
      string = str
      do i = 1, LEN_TRIM(str)
          ic = INDEX(low, str(i:i))
          if (ic > 0) string(i:i) = cap(ic:ic)
      end do
!-----------------------------------------------------------------------
      End Function to_upper
!-----------------------------------------------------------------------
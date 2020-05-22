!-----------------------------------------------------------------------
      module functions
!-----------------------------------------------------------------------
        implicit none
        character(len=26), parameter, private :: low  = 
     .  "abcdefghijklmnopqrstuvwxyz"
        character(len=26), parameter, private :: high = 
     .  "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        contains
!-----------------------------------------------------------------------
! returns upper case of string s
!-----------------------------------------------------------------------
      function to_upper(s) result(t)
!-----------------------------------------------------------------------
        implicit none
        character(len=*), intent(in) :: s
        character(len=len(s))        :: t
!     Local variables
        character(len=1), save       :: convtable(0:255)
        logical, save                :: first = .true.
        integer                      :: i
!-----------------------------------------------------------------------
        if(first) then
           do i=0,255
             convtable(i) = char(i)
           enddo
           do i=1,len(low)
             convtable(iachar(low(i:i))) = char(iachar(high(i:i)))
           enddo
           first = .false.
        endif
        t = s
        do i=1,len_trim(s)
          t(i:i) = convtable(iachar(s(i:i)))
        enddo
!-----------------------------------------------------------------------
      end function to_upper
!-----------------------------------------------------------------------
! returns lower case of string s
!-----------------------------------------------------------------------
      function to_lower(s) result(t)
        implicit none
        character(len=*), intent(in) :: s
        character(len=len(s))        :: t
!     Local variables
        character(len=1), save :: convtable(0:255)
        logical, save          :: first = .true.
        integer                :: i
!-----------------------------------------------------------------------
        if(first) then
          do i=0,255
            convtable(i) = char(i)
          enddo
          do i = 1,len(low)
            convtable(iachar(high(i:i))) = char(iachar(low(i:i)))
          enddo
          first = .false.
        endif
        t = s
        do i=1,len_trim(s)
          t(i:i) = convtable(iachar(s(i:i)))
        enddo
!-----------------------------------------------------------------------
      end function to_lower
!-----------------------------------------------------------------------
      end module functions
!-----------------------------------------------------------------------
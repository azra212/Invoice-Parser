# 0006 Currency minor units

Totals used to allow an absolute difference of 0.01. That is wrong for yen, and it is coarse for three-decimal currencies.

Comparisons now round both sides to the minor unit: 0 for JPY and KRW, 3 for BHD, KWD, and OMR, and 2 otherwise. Line-item math uses the same helper. A mismatch is still a warning on a line and an error on the document total, which matches the earlier product rule.

VAT is separate. A negative tax or a rate above 30% is an error. A positive rate that is not within half a percentage point of a common VAT rate is a warning. Zero tax is valid.

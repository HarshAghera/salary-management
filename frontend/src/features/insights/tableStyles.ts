/** Tighter cell padding below desktop, so six money columns fit a 768 px tablet without scrolling. */
export const COMPACT_CELLS = {
  '& .MuiTableCell-root': { px: { xs: 1.5, lg: 2 } },
  '& .MuiTableCell-root:first-of-type': { pl: { xs: 2, lg: 3 } },
  '& .MuiTableCell-root:last-of-type': { pr: { xs: 2, lg: 3 } },
} as const;

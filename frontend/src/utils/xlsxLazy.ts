/** xlsx is ~400 KB; only load it when someone actually imports an Excel file. */
export const loadXLSX = () => import('xlsx');

export const TotalsServiceMock = {
  getTotal: jest.fn(),
  getTaxTotal: jest.fn(),
  getAllocationItemDiscounts: jest.fn(),
  getDiscountTotal: jest.fn(),
  getLineItemTotals: jest.fn(() => ({ total: 10, tax_lines: [] })),
  getShippingMethodTotals: jest.fn(() => ({
    total: 10,
    tax_lines: [],
  })),
};

const mock = jest.fn().mockImplementation(() => TotalsServiceMock);

export default mock;

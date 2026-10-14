import request from '../request';

const sellerCouponService = {
  getAll: (params) =>
    request.get('dashboard/seller/coupons/paginate', { ...params }),
  getById: (id, params) =>
    request.get(`dashboard/seller/coupons/${id}`, { params }),
  create: (body) => request.post('dashboard/seller/coupons', body),
  update: (id, body) => request.put(`dashboard/seller/coupons/${id}`, body),
  delete: (params) =>
    request.delete(`dashboard/seller/coupons/delete`, { params }),
  dropAll: () => request.get(`dashboard/seller/coupons/drop/all`),
  restoreAll: () => request.get(`dashboard/seller/coupons/restore/all`),
};

export default sellerCouponService;

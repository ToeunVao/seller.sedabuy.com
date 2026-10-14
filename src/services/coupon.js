import request from './request';

const couponService = {
  getAll: (params) =>
    request.get('dashboard/admin/coupons/paginate', { params }),
  getById: (id, params) =>
    request.get(`dashboard/admin/coupons/${id}`, { params }),
  create: (body) => request.post('dashboard/admin/coupons', body),
  update: (id, body) => request.put(`dashboard/admin/coupons/${id}`, body),
  delete: (params) =>
    request.delete(`dashboard/admin/coupons/delete`, { params }),
  dropAll: () => request.get(`dashboard/admin/coupons/drop/all`),
  restoreAll: () => request.get(`dashboard/admin/coupons/restore/all`),
};

export default couponService;

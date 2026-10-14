import request from '../request';

const shopService = {
  get: (params) => request.get('dashboard/seller/shops', { params }),
  create: (params) => request.post('dashboard/seller/shops', {}, { params }),
  update: (body) => request.put(`dashboard/seller/shops`, body),
  setVisibilityStatus: () =>
    request.post('dashboard/seller/shops/visibility/status'),
  setWorkingStatus: () => request.post('dashboard/seller/shops/working/status'),
};

export default shopService;

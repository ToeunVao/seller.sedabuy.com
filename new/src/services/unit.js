import request from './request';

const unitService = {
  getAll: (params) => request.get('dashboard/admin/units/paginate', { params }),
  getById: (id, params) =>
    request.get(`dashboard/admin/units/${id}`, { params }),
  create: (body) => request.post('dashboard/admin/units', body),
  update: (id, body) => request.put(`dashboard/admin/units/${id}`, body),
  delete: (params) =>
    request.delete(`dashboard/admin/units/delete`, { params }),
  setActive: (id) => request.post(`dashboard/admin/units/active/${id}`),
  dropAll: () => request.get(`dashboard/admin/units/drop/all`),
  restoreAll: () => request.get(`dashboard/admin/units/restore/all`),
};

export default unitService;

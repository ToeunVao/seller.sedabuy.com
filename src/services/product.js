import request from './request';
import requestWithoutTimeout from './requestWithoutTimeout';

const productService = {
  getAll: (params) =>
    request.get('dashboard/admin/products/paginate', { params }),
  getById: (id, params) =>
    request.get(`dashboard/admin/products/${id}`, { params }),
  export: (params) =>
    requestWithoutTimeout.get(`dashboard/admin/products/export`, { params }),
  import: (data) =>
    requestWithoutTimeout.post('dashboard/admin/products/import', data),
  create: (body) => request.post(`dashboard/admin/products`, body),
  update: (uuid, body) => request.put(`dashboard/admin/products/${uuid}`, body),
  delete: (params) =>
    request.delete(`dashboard/admin/products/delete`, { params }),
  dropAll: () => request.get(`dashboard/admin/products/drop/all`),
  restoreAll: () => request.get(`dashboard/admin/products/restore/all`),
  extras: (uuid, data) =>
    request.post(`dashboard/admin/products/${uuid}/extras`, data),
  stocks: (uuid, data) =>
    request.post(`dashboard/admin/products/${uuid}/stocks`, data),
  properties: (uuid, data) =>
    request.post(`dashboard/admin/products/${uuid}/properties`, data),
  setActive: (uuid) =>
    request.post(`dashboard/admin/products/${uuid}/active`, {}),
  getStock: (params) =>
    request.get(`dashboard/admin/stocks/select-paginate`, { params }),
  updateStatus: (uuid, params) =>
    request.post(
      `dashboard/admin/products/${uuid}/status/change`,
      {},
      { params },
    ),
  updateStocks: (data) =>
    request.post(`dashboard/admin/stocks/galleries`, data),
};

export default productService;

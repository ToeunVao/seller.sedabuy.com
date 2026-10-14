import request from '../request';

const paymentService = {
  getAll: (params) => request.get('rest/payments', { params }),
  getById: (id, params) => request.get(`rest/shop-payments/${id}`, { params }),
};

export default paymentService;

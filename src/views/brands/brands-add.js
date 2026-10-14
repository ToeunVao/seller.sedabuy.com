import brandService from 'services/brand';
import { BrandForm } from './brand-form';

const BrandsAdd = () => {
  const onSubmit = (body) => brandService.create(body);

  return <BrandForm title='add.brand' onSubmit={onSubmit} />;
};

export default BrandsAdd;

import shopTagService from 'services/shopTag';
import { ShopTagForm } from './form';

const TagAdd = () => {
  const onSubmit = (body) => shopTagService.create(body);

  return <ShopTagForm title='add.shop.tag' onSubmit={onSubmit} />;
};

export default TagAdd;

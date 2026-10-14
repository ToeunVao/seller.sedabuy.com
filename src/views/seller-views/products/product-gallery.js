import { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import productService from 'services/seller/product';
import { useParams } from 'react-router-dom';
import { disableRefetch } from 'redux/slices/menu';
import useDidUpdate from 'helpers/useDidUpdate';
import { ProductStocksGallery } from 'components/forms/product/gallery';

const ProductGallery = ({ prev, next }) => {
  const { uuid } = useParams();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchProduct = () => {
    setIsLoading(true);
    productService
      .getById(uuid)
      .then((res) => {
        setData(res?.data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onFinish = (body) => productService.updateStocks({ data: body });

  const fetch = () => {
    fetchProduct();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (uuid) {
      fetch();
    }
  }, [uuid]);

  useDidUpdate(() => {
    if (activeMenu.refetch && uuid) {
      fetch();
    }
  }, [activeMenu.refetch, uuid]);

  return (
    <ProductStocksGallery
      data={data}
      isLoading={isLoading}
      onNextPage={next}
      onPrevPage={prev}
      onSubmit={onFinish}
    />
  );
};

export default ProductGallery;

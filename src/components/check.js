import { Button, Card, Space, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import orderService from 'services/order';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import useDidUpdate from 'helpers/useDidUpdate';
import { disableRefetch } from 'redux/slices/menu';
import OrderCheck from './order-check';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

const Check = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const printComponentRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
  });

  const fetchOrder = () => {
    setIsLoading(true);
    orderService
      .getById(id)
      .then((res) => {
        if (res?.data) {
          setData([res?.data]);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
      dispatch(disableRefetch(activeMenu));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useDidUpdate(() => {
    if (activeMenu.refetch && id) {
      fetchOrder();
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch, id]);

  return (
    <Card>
      <Space align='end' direction='vertical' className='w-100'>
        <Button type='primary' onClick={handlePrint}>
          {t('print')}
        </Button>
      </Space>
      <div ref={printComponentRef} className='invoice-print-container'>
        <Spin spinning={isLoading}>
          <OrderCheck data={data} />
        </Spin>
      </div>
    </Card>
  );
};

export default Check;

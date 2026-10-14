import { Space, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { GetColorName } from 'hex-color-to-color-name';
import ColumnImage from 'components/column-image';
import numberToPrice from 'helpers/numberToPrice';
import moment from 'moment';
import { shallowEqual, useSelector } from 'react-redux';

const OrderCheck = ({ data, loading = false }) => {
  const { t } = useTranslation();

  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );

  const isMultiple = Array.isArray(data) && data?.length > 1;
  const parentData = data?.find((item) => item?.id && !item?.parent_id);
  const tableDataSource = data?.flatMap((item) => item?.details) || [];
  const informations = [
    {
      id: 1,
      title: t('delivery.type'),
      value: t(parentData?.delivery_type),
      show: true,
    },
    {
      id: 2,
      title: t(
        parentData?.delivery_type === 'delivery'
          ? 'delivery.date'
          : 'pickup.date',
      ),
      value: moment(parentData?.delivery_date).format('YYYY-MM-DD HH:mm'),
      show: true,
    },
    {
      id: 3,
      title: t('otp'),
      value: parentData?.otp,
      show: true,
    },
    {
      id: 4,
      title: t('address'),
      value: parentData?.address?.address,
      show: parentData?.delivery_type === 'delivery',
    },
  ];
  const userInformations = [
    {
      id: 1,
      title: t('full.name'),
      value: `${parentData?.user?.firstname || ''} ${
        parentData?.user?.lastname || ''
      }`,
      show: true,
    },
    {
      id: 2,
      title: t('email'),
      value: parentData?.user?.email,
      show: Boolean(parentData?.user?.email),
    },
    {
      id: 3,
      title: t('phone'),
      value: parentData?.user?.phone,
      show: Boolean(parentData?.user?.phone),
    },
  ];
  const totalPrices = [
    {
      id: 1,
      title: 'products',
      value: numberToPrice(
        data?.reduce((acc, item) => {
          acc += Number(item?.origin_price || 0);
          return acc;
        }, 0),
      ),
    },
    {
      id: 2,
      title: 'delivery.fee',
      value: numberToPrice(
        data?.reduce((acc, item) => {
          acc += Number(item?.delivery_fee || 0);
          return acc;
        }, 0),
      ),
    },
    {
      id: 3,
      title: 'service.fee',
      value: numberToPrice(
        data?.reduce((acc, item) => {
          acc += Number(item?.service_fee || 0);
          return acc;
        }, 0),
      ),
    },
    {
      id: 4,
      title: 'tax',
      value: numberToPrice(
        data?.reduce((acc, item) => {
          acc += Number(item?.tax || 0);
          return acc;
        }, 0),
      ),
    },
    {
      id: 5,
      title: 'discount',
      value: numberToPrice(
        data?.reduce((acc, item) => {
          acc += Number(item?.discount || 0);
          return acc;
        }, 0),
      ),
    },
    {
      id: 6,
      title: 'coupon',
      value: numberToPrice(
        data?.reduce((acc, item) => {
          acc += Number(item?.coupon_price || 0);
          return acc;
        }, 0),
      ),
    },
  ];
  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: t('product'),
      dataIndex: 'stock',
      key: 'product',
      render: (stock, record) => (
        <Space direction='vertical'>
          <span>{stock?.product?.translation?.title}</span>
          <Space wrap>
            {stock?.extras?.map((extra) => (
              <Tag key={extra?.id}>
                {extra?.group?.translation?.title}:{' '}
                {extra?.group?.type === 'color'
                  ? GetColorName(extra?.value?.value)
                  : extra?.value?.value}
              </Tag>
            ))}
            {Boolean(record?.bonus) && (
              <Tag key='bonus' color='red'>
                {t('bonus')}
              </Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: t('image'),
      dataIndex: 'stock',
      key: 'image',
      render: (stock) => (
        <ColumnImage image={stock?.product?.img} id={stock?.id} />
      ),
    },
    {
      title: t('price'),
      dataIndex: 'stock',
      key: 'price',
      render: (stock) => (
        <div style={{ minWidth: 'max-content' }}>
          {numberToPrice(stock?.price)}
        </div>
      ),
    },
    {
      title: t('quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) =>
        (quantity || 0) * (record?.stock?.product?.interval || 1),
    },
    {
      title: t('discount'),
      dataIndex: 'stock',
      key: 'discount',
      render: (stock) => (
        <div style={{ minWidth: 'max-content' }}>
          {numberToPrice(stock?.discount)}
        </div>
      ),
    },
    {
      title: t('tax'),
      dataIndex: 'tax',
      key: 'tax',
      render: (tax) => (
        <div style={{ minWidth: 'max-content' }}>{numberToPrice(tax)}</div>
      ),
    },
    {
      title: t('total.price'),
      dataIndex: 'total_price',
      key: 'total_price',
      render: (totalPrice) => (
        <div style={{ minWidth: 'max-content' }}>
          {numberToPrice(totalPrice)}
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        className='flex justify-content-between align-items-center mb-3'
        style={{ gap: '30px' }}
      >
        <ColumnImage image={settings?.logo} size={200} preview={false} />
        <Space direction='vertical'>
          <Typography.Title level={3} className='m-0'>
            {settings?.title}
          </Typography.Title>
          <Typography.Text>{settings?.address}</Typography.Text>
        </Space>
      </div>
      <div
        className='flex justify-content-between align-items-start mb-3'
        style={{ gap: '30px' }}
      >
        <Space direction='vertical'>
          <Typography.Title level={4} strong className='mb-1'>
            {t(isMultiple ? 'orders' : 'order')}:{' '}
            {data?.map((item) => item?.id)?.join(', ')}
          </Typography.Title>
          {informations
            .filter((information) => information.show)
            .map((information) => (
              <Typography.Text key={information.id}>
                {information.title}: {information.value}
              </Typography.Text>
            ))}
        </Space>
        <Space direction='vertical'>
          <Typography.Title level={4} strong className='mb-1'>
            {t('user')}: {parentData?.user?.id}
          </Typography.Title>
          {userInformations
            .filter((userInformation) => userInformation.show)
            .map((userInformation) => (
              <Typography.Text key={userInformation.id}>
                {userInformation.title}: {userInformation.value}
              </Typography.Text>
            ))}
        </Space>
      </div>
      <Table
        loading={loading}
        scroll={{ x: true }}
        pagination={false}
        dataSource={tableDataSource}
        columns={columns}
      />
      <Space direction='vertical' align='end' className='mt-3 mb-3 w-100'>
        {totalPrices.map((item) => (
          <Space key={item?.id} className='w-100'>
            <Typography.Text>{t(item?.title)}</Typography.Text>:{' '}
            <Typography.Title level={4} className='m-0'>
              {item?.value}
            </Typography.Title>
          </Space>
        ))}
        <Space key='total-price' className='w-100'>
          <Typography.Title level={4} className='m-0'>
            {t('total.price')}
          </Typography.Title>
          :{' '}
          <Typography.Title level={3} className='m-0'>
            {numberToPrice(
              data?.reduce((acc, item) => {
                acc += Number(item?.total_price || 0);
                return acc;
              }, 0),
            )}
          </Typography.Title>
        </Space>
      </Space>
      <Typography.Text style={{ display: 'block', textAlign: 'center' }}>
        © {moment(new Date()).format('YYYY')} {settings?.title}.{' '}
        {t('all.rights.reserved')}
      </Typography.Text>
    </>
  );
};

export default OrderCheck;

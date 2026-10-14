import React from 'react';
import {
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  CarOutlined,
  DollarOutlined,
  PayCircleOutlined,
  BorderlessTableOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  ContainerOutlined,
} from '@ant-design/icons';
import { Avatar, Card, List, Skeleton, Space } from 'antd';
import numberToPrice from '../helpers/numberToPrice';
import { BiMap } from 'react-icons/bi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import useDemo from 'helpers/useDemo';
import { getDateFormat } from '../helpers/get-date-format';
const { Meta } = Card;

const OrderCard = ({
  data: item,
  goToShow,
  loading,
  setLocationsMap,
  setId,
  setIsModalVisible,
  setText,
  setDowloadModal,
  setTabType,
}) => {
  const { t } = useTranslation();
  const data = [
    {
      title: t('products.number'),
      icon: <ContainerOutlined />,
      data: item?.order_details_count || 0,
    },
    {
      title: t('deliveryman'),
      icon: <CarOutlined />,
      data: item?.deliveryman
        ? `${item?.deliveryman?.firstname || ''} ${
            item?.deliveryman?.lastname || ''
          }`
        : t('N/A'),
    },
    {
      title: t('total.price'),
      icon: <DollarOutlined />,
      data: numberToPrice(
        item?.total_price,
        item.currency?.symbol,
        item.currency?.position,
      ),
    },
    {
      title: t('payment.type'),
      icon: <PayCircleOutlined />,
      data: t(item?.transaction?.payment_system?.tag || 'N/A'),
    },
    {
      title: t('payment.status'),
      icon: <BorderlessTableOutlined />,
      data: t(item?.transaction?.status || 'N/A'),
    },
    {
      title: t('delivery.type'),
      icon: <FieldTimeOutlined />,
      data: t(item?.delivery_type || 'N/A'),
    },
    {
      title: t('delivery.date'),
      icon: <FieldTimeOutlined />,
      data: getDateFormat({ date: item?.delivery_date }),
    },
    {
      title: t('created.at'),
      icon: <FieldTimeOutlined />,
      data: getDateFormat({ date: item?.created_at }),
    },
  ];
  const { isDemo } = useDemo();
  const actions = [
    <BiMap
      size={20}
      onClick={(e) => {
        e.stopPropagation();
        setLocationsMap(item.id);
      }}
    />,
    <DeleteOutlined
      onClick={(e) => {
        if (isDemo) {
          toast.warning(t('cannot.work.demo'));
          return;
        }
        e.stopPropagation();
        setId([item.id]);
        setIsModalVisible(true);
        setText(true);
        setTabType(item.status);
      }}
    />,
    <DownloadOutlined
      onClick={(e) => {
        e.stopPropagation();
        setDowloadModal(item.id);
      }}
    />,
    <EyeOutlined
      onClick={(e) => {
        e.stopPropagation();
        goToShow(item);
      }}
    />,
  ];

  return (
    <Card actions={actions} className='order-card'>
      <Skeleton loading={loading} avatar active>
        <Meta
          avatar={<Avatar src={item?.user?.img} icon={<UserOutlined />} />}
          description={`#${item?.id}`}
          title={
            item?.user
              ? `${item?.user?.firstname || ''} ${item?.user?.lastname || ''}`
              : t('deleted.user')
          }
        />
        <List
          itemLayout='horizontal'
          dataSource={data}
          renderItem={(item, key) => (
            <List.Item key={key}>
              <Space>
                {item?.icon}
                {`${item?.title}:  ${item?.data}`}
              </Space>
            </List.Item>
          )}
        />
      </Skeleton>
    </Card>
  );
};

export default OrderCard;

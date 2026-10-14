import { Button, Card, Table, Tag, Typography } from 'antd';
import numberToPrice from 'helpers/numberToPrice';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { disableRefetch } from 'redux/slices/menu';
import userService from 'services/user';
import useDidUpdate from 'helpers/useDidUpdate';
import WalletTopUp from './top-up';

const SellerWallet = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    userService
      .profileShow()
      .then((res) => {
        setUser(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
    dispatch(disableRefetch(activeMenu));
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetchProfile();
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (createdAt) => moment(createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag>{t(status)}</Tag>,
    },
    {
      title: t('type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag>{t(type)}</Tag>,
    },
    {
      title: t('note'),
      dataIndex: 'note',
      key: 'note',
    },
  ];

  return (
    <Card
      title={t('seller.wallet')}
      extra={
        <Button type='primary' disabled={loading} onClick={() => setOpen(true)}>
          {t('top.up')}
        </Button>
      }
    >
      <Typography.Title>{numberToPrice(user?.wallet?.price)}</Typography.Title>
      <Table
        loading={loading}
        dataSource={user?.wallet?.histories}
        columns={columns}
      />
      {open && <WalletTopUp open={open} onCancel={() => setOpen(false)} />}
    </Card>
  );
};

export default SellerWallet;

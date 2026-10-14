import { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Table } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { disableRefetch, setRefetch } from 'redux/slices/menu';
import { shallowEqual, useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { fetchSms } from 'redux/slices/sms-geteways';
import { useNavigate } from 'react-router-dom';
import { addMenu } from 'redux/slices/menu';
import { toast } from 'react-toastify';
import { Context } from 'context/context';
import useDidUpdate from 'helpers/useDidUpdate';
import CustomModal from 'components/modal';
import smsService from 'services/smsPayloads';

export default function SmsGateways() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { smsGatewaysList, loading } = useSelector(
    (state) => state.sms,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const columns = [
    {
      title: t('type'),
      dataIndex: 'type',
      width: '80%',
    },
    // {
    //   title: t('twilio.number'),
    //   dataIndex: 'twilio_number',
    //   render: (_, row) => row.payload?.twilio_number,
    // },
    {
      title: t('options'),
      key: 'options',
      dataIndex: 'options',
      is_show: true,
      render: (_, row) => {
        return (
          <Space>
            <Button
              type='primary'
              icon={<EditOutlined />}
              onClick={() => goToEdit(row.type)}
            />
            <Button
              icon={<DeleteOutlined />}
              onClick={() => {
                setId([row?.type]);
                setIsModalVisible(true);
              }}
            />
          </Space>
        );
      },
    },
  ];

  const goToEdit = (type) => {
    dispatch(
      addMenu({
        id: 'sms-payload-edit',
        url: `settings/sms-payload/${type}`,
        name: t('edit.sms.payload'),
      }),
    );
    navigate(`/settings/sms-payload/${type}`);
  };

  const goToAdd = () => {
    dispatch(
      addMenu({
        id: 'sms-payload-add',
        url: 'settings/sms-payload/add',
        name: t('add.sms.payload'),
      }),
    );
    navigate('/settings/sms-payload/add');
  };

  const handleDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    smsService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
        setId(null);
        setIsModalVisible(false);
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  useEffect(() => {
    dispatch(fetchSms());
    dispatch(disableRefetch(activeMenu));
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      dispatch(fetchSms());
      dispatch(disableRefetch(activeMenu));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  return (
    <>
      <Card
        title={t('sms.payload')}
        extra={
          <Space>
            <Button
              type='primary'
              icon={<PlusCircleOutlined />}
              onClick={goToAdd}
            >
              {t('add.sms.payload')}
            </Button>
          </Space>
        }
      >
        <Table
          scroll={{ x: true }}
          columns={columns}
          rowKey={(record) => record.id}
          dataSource={smsGatewaysList}
          pagination={false}
          loading={loading}
        />
      </Card>
      <CustomModal
        click={handleDelete}
        text={t('delete')}
        setText={setId}
        loading={loadingBtn}
      />
    </>
  );
}

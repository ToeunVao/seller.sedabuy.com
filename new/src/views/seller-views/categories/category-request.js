import { useContext, useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import getImage from 'helpers/getImage';
import CreateCategory from './createCategory';
import { EditOutlined, MessageOutlined } from '@ant-design/icons';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { useNavigate, useParams } from 'react-router-dom';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';
import { fetchSellerRequestModels } from 'redux/slices/request-models';
import { HiArrowNarrowRight } from 'react-icons/hi';
import DeleteButton from 'components/delete-button';
import requestModelsService from 'services/seller/request-models';
import ColumnImage from 'components/column-image';

export default function SellerCategoryRequests({
  parentId,
  activeTab = 'request',
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const {
    data: requests,
    meta,
    loading,
  } = useSelector((state) => state.requestModels, shallowEqual);
  const { defaultLang } = useSelector((state) => state.formLang, shallowEqual);
  const { uuid: parentUuid } = useParams();

  const { setIsModalVisible } = useContext(Context);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [isVisibleMsgModal, setIsVisibleMsgModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [id, setId] = useState(null);
  const [filters, setFilters] = useState({ page: 1 });
  const [columns, setColumns] = useState([
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      is_show: true,
      render: (_, row) => (
        <Space>
          {row?.model?.translation?.title || t('N/A')} <HiArrowNarrowRight />{' '}
          {row?.data?.[
            `title[${defaultLang || row?.model?.translation?.locale}]`
          ] || t('N/A')}
        </Space>
      ),
    },
    {
      title: t('image'),
      dataIndex: 'img',
      key: 'img',
      is_show: true,
      render: (_, row) => (
        <Space>
          <ColumnImage image={getImage(row?.model?.img)} size={100} />
          <HiArrowNarrowRight />
          <ColumnImage image={getImage(row?.data?.images?.[0])} size={100} />
        </Space>
      ),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      is_show: true,
      render: (status) => (
        <Tag
          color={
            status === 'pending'
              ? 'blue'
              : status === 'unpublished'
                ? 'red'
                : 'cyan'
          }
        >
          {t(status)}
        </Tag>
      ),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          {Boolean(row?.status === 'cancelled' && row?.status_note) && (
            <Button
              icon={<MessageOutlined />}
              onClick={() => {
                setIsVisibleMsgModal(true);
                setModalText(row?.status_note);
              }}
            />
          )}
          <DeleteButton
            onClick={() => {
              setId([row?.id]);
              setIsModalVisible(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    page: filters.page,
    parent_id: parentId,
    type: 'category',
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `seller/category-request/${row.id}`,
        id: 'request_edit',
        name: t('request.edit'),
      }),
    );
    navigate(`/seller/category-request/${row.id}`, {
      state: { parentId, parentUuid },
    });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const categoryDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    requestModelsService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
        setIsModalVisible(false);
      })
      .finally(() => setLoadingBtn(false));
  };

  const handleCancel = () => setIsModalOpen(false);

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const fetch = () => {
    dispatch(fetchSellerRequestModels(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (activeTab === 'request') {
      fetch();
    }
  }, [activeTab]);

  useDidUpdate(() => {
    if (activeMenu.refetch && activeTab === 'request') {
      fetch();
    }
  }, [activeMenu.refetch, activeTab]);

  useDidUpdate(() => {
    if (activeTab === 'request') {
      fetch();
    }
  }, [activeMenu.data, activeTab]);

  return (
    <Card
      title={t('requests')}
      extra={
        <Space wrap>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={requests}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          total: meta?.total || 0,
          current: meta?.current_page || 1,
        }}
        rowKey={(record) => record.key}
        onChange={onChangePagination}
        loading={loading}
      />
      {Boolean(isModalOpen) && (
        <CreateCategory handleCancel={handleCancel} isModalOpen={isModalOpen} />
      )}
      <CustomModal
        click={categoryDelete}
        text={t('delete')}
        setText={setId}
        loading={loadingBtn}
      />
      <Modal
        title={t('reject.message')}
        closable={false}
        visible={isVisibleMsgModal}
        footer={null}
        centered
      >
        <p>{modalText}</p>
        <div className='d-flex justify-content-end'>
          <Button
            type='primary'
            className='mr-2'
            onClick={() => setIsVisibleMsgModal(false)}
          >
            {t('close')}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

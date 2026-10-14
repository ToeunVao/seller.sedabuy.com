import React, { useContext, useEffect, useState } from 'react';
import { Card, Image, Table, Button, Space, Tag, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import getImage from 'helpers/getImage';
import { EditOutlined, MessageOutlined } from '@ant-design/icons';
import { addMenu, disableRefetch, setMenuData } from 'redux/slices/menu';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { useNavigate, useParams } from 'react-router-dom';
import FilterColumns from 'components/filter-column';
import formatSortType from 'helpers/formatSortType';
import useDidUpdate from 'helpers/useDidUpdate';
import { fetchRequestModels } from 'redux/slices/request-models';
import { HiArrowNarrowRight } from 'react-icons/hi';
import requestAdminModelsService from 'services/request-models';
import moment from 'moment';
import CategoryRequestModal from './category-request-modal';
import ColumnImage from '../../components/column-image';

const body = {
  type: 'category',
};

export default function CategoryRequestList({
  parentId,
  type = 'main',
  activeTab = 'request',
}) {
  const { t } = useTranslation();
  const { setIsModalVisible } = useContext(Context);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [isVisibleMsgModal, setIsVisibleMsgModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [id, setId] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const {
    data: requests,
    meta,
    loading,
    params,
  } = useSelector((state) => state.requestModels, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const data = activeMenu.data;
  const { uuid: parentUuid } = useParams();

  const paramsData = {
    search: data?.search,
    sort: data?.sort,
    column: data?.column,
    perPage: data?.perPage,
    page: data?.page,
    parent_id: parentId,
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `category-request/${row.id}`,
        id: 'request_edit',
        name: t('request.edit'),
      }),
    );
    navigate(`/category-request/${row.id}`, {
      state: { parentId, parentUuid },
    });
  };

  const [columns, setColumns] = useState([
    {
      title: t('created.by'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      is_show: true,
      render: (createdBy) => (
        <span>
          {createdBy.firstname || ''} {createdBy?.lastname || ''}{' '}
          <a href={`tel:${createdBy?.phone}`}>{createdBy?.phone}</a>
        </span>
      ),
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (createdAt) => moment(createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('title'),
      dataIndex: 'title',
      key: 'title',
      is_show: true,
      render: (_, row) => (
        <Space>
          {row?.model?.translation?.title || t('N/A')} <HiArrowNarrowRight />{' '}
          {
            row?.data?.[
              `title[${row?.model?.translation?.locale || defaultLang}]`
            ]
          }
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
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => goToEdit(row)} />
          {row?.status === 'canceled' && row?.status_note && (
            <Button
              icon={<MessageOutlined />}
              onClick={() => {
                setModalText(row.status_note);
                setIsVisibleMsgModal(true);
              }}
            />
          )}
          <Button
            type='primary'
            onClick={() => {
              setId([{ id: row.id, status: 'approved' }]);
              setIsModalVisible(true);
            }}
          >
            {t('accept')}
          </Button>
          <Button
            type='primary'
            danger
            onClick={() => {
              setId([{ id: row.id, status: 'canceled' }]);
              setModalVisible(true);
            }}
          >
            {t('decline')}
          </Button>
        </Space>
      ),
    },
  ]);

  useEffect(() => {
    if (activeMenu.refetch && activeTab === 'request') {
      dispatch(fetchRequestModels(paramsData));
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    if (activeTab === 'request') {
      dispatch(fetchRequestModels(paramsData));
    }
  }, [activeMenu.data, activeTab]);

  function onChangePagination(pagination, filter, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...activeMenu.data, perPage, page, column, sort },
      }),
    );
  }

  const requestStatusChange = (data) => {
    setLoadingBtn(true);
    const params = {
      status: id?.at(0).status,
      status_note: data?.status_note,
    };
    requestAdminModelsService
      .changeStatus(id?.at(0).id, params)
      .then(() => {
        toast.success(t('successfully.changed'));
        dispatch(fetchRequestModels(body));
        setIsModalVisible(false);
        setId(null);
      })
      .finally(() => {
        setModalVisible(false);
        setLoadingBtn(false);
      });
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const handleFilter = (items) => {
    const data = activeMenu.data;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, ...items },
      }),
    );
  };

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
          pageSize: params.perPage,
          page: activeMenu.data?.page || 1,
          total: meta.total,
          defaultCurrent: activeMenu.data?.page,
          current: activeMenu.data?.page,
        }}
        rowKey={(record) => record.key}
        onChange={onChangePagination}
        loading={loading}
      />
      <CustomModal
        click={requestStatusChange}
        text={t('change.status')}
        setText={setId}
        loading={loadingBtn}
      />
      <CategoryRequestModal
        data={{ title: 'decline' }}
        visible={modalVisible}
        handleCancel={() => setModalVisible(false)}
        handleOk={requestStatusChange}
        laoding={loadingBtn}
      />
      <Modal
        title='Reject message'
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

import { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Switch, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import bannerService from 'services/banner';
import { fetchBanners } from 'redux/slices/banner';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';
import ColumnImage from 'components/column-image';
import { getDateFormat } from 'helpers/get-date-format';

const Banners = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { banners, meta, loading } = useSelector(
    (state) => state.banner,
    shallowEqual,
  );
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { setIsModalVisible } = useContext(Context);

  const [loadingBtn, setLoadingBtn] = useState(false);
  const [id, setId] = useState(null);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
  });
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
    },
    {
      title: t('image'),
      dataIndex: 'img',
      key: 'img',
      is_show: true,
      render: (img) => <ColumnImage image={img} size={100} />,
    },
    {
      title: t('position'),
      dataIndex: 'type',
      key: 'type',
      is_show: true,
      render: (position) => t(position),
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      is_show: true,
      render: (active, row) => (
        <Switch
          checked={active}
          onChange={() => {
            setIsModalVisible(true);
            setId([row?.id]);
            setText(t('set.active.text'));
          }}
        />
      ),
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (created_at) => getDateFormat({ date: created_at }),
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
          <Button icon={<CopyOutlined />} onClick={() => goToClone(row)} />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([row.id]);
              setText(t('delete'));
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    page: filters.page,
    perPage: 10,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, value }));
  };

  const goToAddBanners = () => {
    dispatch(
      addMenu({
        id: 'banner/add',
        url: 'banner/add',
        name: t('add.banner'),
      }),
    );
    navigate('/banner/add');
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `banner/${row.id}`,
        id: 'banner_edit',
        name: t('edit.banner'),
      }),
    );
    navigate(`/banner/${row.id}`);
  };

  const goToClone = (row) => {
    dispatch(
      addMenu({
        url: `banner/clone/${row.id}`,
        id: 'banner_clone',
        name: t('clone.banner'),
      }),
    );
    navigate(`/banner/clone/${row.id}`);
  };

  const bannerDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    bannerService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
        setIsModalVisible(false);
        setId(null);
        setText(null);
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.the.product'));
    } else {
      setIsModalVisible(true);
      setText(t('delete.selected'));
    }
  };

  const handleActive = () => {
    setLoadingBtn(true);
    bannerService
      .setActive(id?.[0])
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(setRefetch(activeMenu));
        setIsModalVisible(false);
        setId(null);
        setText(null);
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  const handleChangeCustomModal = () => {
    switch (text) {
      case t('delete'):
      case t('delete.selected'):
        bannerDelete();
        break;
      case t('set.active.text'):
        handleActive();
        break;
      default:
        break;
    }
  };

  const fetch = () => {
    console.log('params', params);
    dispatch(fetchBanners(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    fetch();
  }, [filters]);

  return (
    <Card
      title={t('banners')}
      navLInkTo={''}
      extra={
        <Space wrap>
          <Button
            type='primary'
            icon={<PlusCircleOutlined />}
            onClick={goToAddBanners}
          >
            {t('add.banner')}
          </Button>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns setColumns={setColumns} columns={columns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={banners}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          page: meta?.current_page || 1,
          total: meta?.total || 0,
        }}
        rowKey={(record) => record.id}
        loading={loading}
        onChange={onChangePagination}
      />
      <CustomModal
        click={handleChangeCustomModal}
        text={text}
        loading={loadingBtn}
        setText={setId}
      />
    </Card>
  );
};

export default Banners;

import { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import storeisService from 'services/seller/storeis';
import { fetchStoreis } from 'redux/slices/storeis';
import FilterColumns from 'components/filter-column';
import useDemo from 'helpers/useDemo';
import ColumnImage from 'components/column-image';
import useDidUpdate from 'helpers/useDidUpdate';

const Storeis = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isDemo } = useDemo();
  const { setIsModalVisible } = useContext(Context);

  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { storeis, meta, loading } = useSelector(
    (state) => state.storeis,
    shallowEqual,
  );

  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
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
      dataIndex: 'file_urls',
      key: 'file_urls',
      is_show: true,
      render: (fileUrls) => <ColumnImage image={fileUrls?.[0]} />,
    },
    {
      title: t('product'),
      dataIndex: 'product',
      key: 'product',
      is_show: true,
      render: (product) => product?.translation?.title,
    },
    {
      title: t('options'),
      key: 'options',
      dataIndex: 'id',
      is_show: true,
      render: (id) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(id)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([id]);
              setText(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    shop_id: myShop?.id,
    page: filters.page,
  };

  const goToAdd = () => {
    if (isDemo) {
      toast.warning(t('cannot.work.demo'));
      return;
    }
    dispatch(
      addMenu({
        id: 'add.story',
        url: `seller/story/add`,
        name: t('add.story'),
      }),
    );
    navigate(`/seller/story/add`);
  };

  const goToEdit = (id) => {
    if (isDemo) {
      toast.warning(t('cannot.work.demo'));
      return;
    }
    dispatch(
      addMenu({
        url: `seller/story/${id}`,
        id: 'story_edit',
        name: t('edit.story'),
      }),
    );
    navigate(`/seller/story/${id}`);
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
    storeisService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
      });
  };

  const onChangePagination = (pageNumber) => {
    const { current } = pageNumber;
    setFilters((prev) => ({ ...prev, page: current }));
  };

  const rowSelection = {
    id,
    onChange: (newSelectedRowKeys) => {
      setId(newSelectedRowKeys);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.the.story'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchStoreis(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    fetch();
  }, [filters.page]);

  return (
    <Card
      title={t('stories')}
      extra={
        <Space>
          <Button
            icon={<PlusCircleOutlined />}
            type='primary'
            onClick={goToAdd}
          >
            {t('add.story')}
          </Button>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={storeis}
        pagination={{
          showSizeChanger: false,
          pageSize: Number(meta?.per_page || 10),
          page: meta?.current_page || 1,
          total: meta?.total || 0,
        }}
        rowKey={(record) => record.id}
        loading={loading}
        onChange={onChangePagination}
      />
      <CustomModal
        click={bannerDelete}
        text={text ? t('delete') : t('delete.selected')}
        setText={setId}
        loading={loadingBtn}
      />
    </Card>
  );
};

export default Storeis;

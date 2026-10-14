import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Divider, Space, Layout, Input } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import LangModal from '../lang-modal';
import NotificationBar from '../notificationBar';
import { navCollapseTrigger } from 'redux/slices/theme';
import ThemeConfigurator from '../theme-configurator';
import i18n from 'configs/i18next';
import { RiArrowDownSFill } from 'react-icons/ri';
import Scrollbars from 'react-custom-scrollbars';
import NavProfile from '../nav-profile';
import MenuList from './menu-list';
import { data as allRoutes } from 'configs/menu-config';

const { Sider } = Layout;

const Sidebar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { pathname } = useLocation();
  const { user } = useSelector((state) => state.auth, shallowEqual);
  // const { system_refund, payment_type, by_subscription } = useSelector(
  //   (state) => state.globalSettings.settings,
  //   shallowEqual,
  // );
  const { navCollapsed } = useSelector(
    (state) => state.theme.theme,
    shallowEqual,
  );
  const { languages } = useSelector((state) => state.formLang, shallowEqual);
  // const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const { theme } = useSelector((state) => state.theme, shallowEqual);

  const parcelMode = useMemo(
    () => !!theme.parcelMode && user?.role === 'admin',
    [theme, user],
  );
  const routes = useMemo(
    () => user.urls,
    // eslint-disable-next-line
    [user?.id],
  );

  const [langModal, setLangModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actualRoutes, setActualRoutes] = useState(user.urls);

  const filteredList = (searchTerm) => {
    if (!searchTerm.length) {
      return actualRoutes;
    }

    const searchTermLower = searchTerm.toLowerCase();

    const filterItems = (items) => {
      return items.reduce((acc, item) => {
        const itemName = t(item?.name)?.toLowerCase();
        if (itemName?.includes(searchTermLower?.toLowerCase())) {
          acc.push(item);
        } else if (item?.menus) {
          const filteredMenus = filterItems(item.menus);
          if (filteredMenus.length) {
            acc.push({ ...item, menus: filteredMenus });
          }
        } else if (item?.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length) {
            acc.push({ ...item, children: filteredChildren });
          }
        }
        return acc;
      }, []);
    };

    return filterItems(routes);
  };

  const menuList = filteredList(searchTerm);

  const findActive = (item) => {
    if (item?.type === 'single' && pathname.includes(item?.url)) {
      return item;
    }
    if (item?.type === 'group') {
      for (const menu of item?.menus || []) {
        const tempActiveMenu = findActive(menu);
        if (tempActiveMenu) return tempActiveMenu;
      }
    }
    if (item?.type === 'parent') {
      for (const child of item?.children || []) {
        const activeChild = findActive(child);
        if (activeChild) return activeChild;
      }
    }
    return null;
  };

  const active =
    routes?.reduce((acc, item) => acc || findActive(item), null) || routes?.[0];

  const menuTrigger = (event) => {
    event.stopPropagation();
    dispatch(navCollapseTrigger());
  };

  useEffect(() => {
    if (parcelMode) {
      setActualRoutes(allRoutes.parcel);
    } else if (user?.urls) {
      setActualRoutes(user.urls);
    }
  }, [user?.id, parcelMode]);

  useEffect(() => {
    setSearchTerm('');
  }, [user?.id]);

  return (
    <>
      <Sider
        className='navbar-nav side-nav'
        width={250}
        collapsed={navCollapsed}
        style={{ height: '100vh', top: 0 }}
      >
        <NavProfile user={user} />
        <div className='menu-collapse' onClick={menuTrigger}>
          <MenuFoldOutlined />
        </div>
        {navCollapsed && (
          <div className='flex justify-content-center'>
            <ThemeConfigurator />
          </div>
        )}

        {!navCollapsed ? (
          <Space className='mx-4 mt-2 d-flex justify-content-between'>
            <span className='icon-button' onClick={() => setLangModal(true)}>
              <img
                className='globalOutlined'
                src={
                  languages?.find((item) => item?.locale === i18n.language)?.img
                }
                alt={user?.fullName}
              />
              <span className='default-lang'>{i18n.language}</span>
              <RiArrowDownSFill size={15} />
            </span>
            <span className='d-flex'>
              <ThemeConfigurator />
              <NotificationBar />
            </span>
          </Space>
        ) : (
          <div className='menu-unfold' onClick={menuTrigger}>
            <MenuUnfoldOutlined />
          </div>
        )}
        <Divider style={{ margin: '10px 0' }} />

        {!navCollapsed && (
          <span className='mt-2 mb-2 d-flex justify-content-center'>
            <Input
              placeholder='search'
              style={{ width: '90%' }}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              prefix={<SearchOutlined />}
            />
          </span>
        )}
        <Scrollbars
          autoHeight
          autoHeightMax={`calc(100vh - ${navCollapsed ? 137 : 181}px)`}
          autoHeightMin={`calc(100vh - ${navCollapsed ? 137 : 181}px)`}
          autoHide
          style={{ overflowX: 'hidden !important' }}
        >
          <MenuList data={menuList} active={active} />
        </Scrollbars>
      </Sider>

      {langModal && (
        <LangModal
          visible={langModal}
          handleCancel={() => setLangModal(false)}
        />
      )}
    </>
  );
};
export default Sidebar;

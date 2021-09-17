import { useState, createContext } from 'react';

interface SideBarContextData {
    itemSideBar: string;
    selectedMenu: string;
    handleItemSideBar(item: string): void;
    handleSelectedMenu(menu: string): void;
}

const SideBarContext = createContext<SideBarContextData>({} as SideBarContextData);

const SideBarProvider: React.FC = ({ children }) => {
    const [itemSideBar, setItemSideBar] = useState('dashboard');
    const [selectedMenu, setSelectedMenu] = useState('');

    function handleItemSideBar(item: string) {
        setItemSideBar(item);
    }

    function handleSelectedMenu(menu: string) {
        setSelectedMenu(menu);
    }

    return (
        <SideBarContext.Provider value={{ itemSideBar, selectedMenu, handleItemSideBar, handleSelectedMenu }}>
            {children}
        </SideBarContext.Provider>
    );
}

export { SideBarContext, SideBarProvider };
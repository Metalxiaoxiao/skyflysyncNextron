'use client'
// 在你的 React 组件中引入所需的模块
import { Card, Button } from 'antd';
import {LineOutlined, CloseOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import React, {useEffect} from "react";

const { Meta } = Card;



export const Layout = ({children,}: {
    children: React.ReactNode
}) => {
    useEffect(() => {
        const listenFromMain = window.ipc.on('main-message', (message) => {

        });
        window.ipc.on('alert', (event, message) => {
            alert(message);
        });
    }, []);
    const handleMinimize = () => {
        window.ipc.send('minimize-window',null);
    };

    const handleClose = () => {
        window.ipc.send('close-window',null);
    };

    return (
        <Draggable handle=".drag-handle">
            <Card
                title={
                    <div className="drag-handle">
                        SkyFlySync
                    </div>
                }
                bordered={false}
                extra={<><Button
                    type="text"
                    icon={<LineOutlined/>}
                    onClick={handleMinimize}/><Button
                    type="text"
                    icon={<CloseOutlined/>}
                    onClick={handleClose}/></>
                }
            >
                {children}
            </Card>
        </Draggable>
    );
};

export default Layout;




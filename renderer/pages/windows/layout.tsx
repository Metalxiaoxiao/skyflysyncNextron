'use client'
// 在你的 React 组件中引入所需的模块
import { Card, Button, Alert, Flex } from 'antd';
import {LineOutlined, CloseOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import React, {useEffect, useState} from "react";

const { Meta } = Card;



export const Layout = ({children,}: {
    children: React.ReactNode
}) => {
    const [networkState,setNetworkState] = useState(true);
    useEffect(() => {
        const listenFromMain = window.ipc.on('main-message', (message) => {
        window.ipc.on('nerworkState',(event,state:boolean)=>{
            setNetworkState(state);
        })
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
                        SkyFlySync 课堂管理系统
                    </div>
                }
                bordered={false}
                extra={
                
    <Flex align='center' gap={10}>
        {
            networkState?null:<Alert
            message="网络连接已断开"
            type="warning"
            showIcon
          />
        }
        
    <Flex align='center'>    <Button
                    type="text"
                    icon={<LineOutlined/>}
                    onClick={handleMinimize}/><Button
                    type="text"
                    icon={<CloseOutlined/>}
                    onClick={handleClose}/></Flex>
</Flex>
                }
            >
                {children}
            </Card>
        </Draggable>
    );
};

export default Layout;




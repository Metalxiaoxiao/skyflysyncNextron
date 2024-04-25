'use client'
// 在你的 React 组件中引入所需的模块
import { Card, Button, Flex, Dropdown, Slider } from 'antd';
import { LineOutlined, CloseOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import React, { useEffect } from "react";

const { Meta } = Card;



const Layout = ({ children,rightElement }: {
    children: React.ReactNode;
    rightElement: React.ReactNode
},) => {
    useEffect(() => {
        const listenFromMain = window.ipc.on
        listenFromMain('main-message', (event, message) => {

        });
        listenFromMain('alert', (event, message) => {
            alert(message);
        });
    }, []);
    const handleMinimize = () => {
        window.ipc.send('minimize-window', null);
    };

    const handleClose = () => {
        window.ipc.send('closeHomeworkWindow', null);
    };

    return (
        <Draggable handle=".drag-handle">
            <Card 
                title={
                    <div>
                        今日作业
                    </div>
                }
                extra={
                    <Flex gap={5}>
                        {rightElement}
                        
                        <Button
                            type="text"
                            icon={<LineOutlined />}
                            onClick={handleMinimize} /><Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={handleClose} />
                    </Flex>
                }
            >
                {children}
            </Card>
        </Draggable>
    );
};

export default Layout;



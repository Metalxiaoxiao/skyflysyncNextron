'use client'
import React, { useEffect, useState } from 'react';
import VirtualList from 'rc-virtual-list';
import { Avatar, Card, List, Button, Layout, Menu, message, Space, QRCode, Row, Col, Popover, Switch, TimePicker, Progress } from 'antd';
import { MessageOutlined, SettingOutlined } from '@ant-design/icons';
const { Header, Content, Sider } = Layout;
const { Meta } = Card;
import { Empty } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import TextField from "@mui/material/TextField";
import { Layout as Lo } from '../layout';
import { Margin } from '@mui/icons-material';

interface MessageItem {
    id: number;
    title: string;
    sender: string;
    content: string;
    attachments?: {
        filename: string;
        url: string;
    }[];
}


const MessageList: React.FC = () => {
    const [messageData, setMessageData] = useState([]);
    const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');

    const appendData = async () => {
        await window.ipc.invoke('getMessages').then((data) => {
            setMessageData(messageData.concat(data));
            message.success(`${data.length} 条被加载!`);
            setTimeout(() => { document.location.href = '#bottom' }, 2000)
        })
    };
    const [userData, setUserData] = useState({
        userId: undefined,
        userName: undefined
    });
    useEffect(() => {
        appendData();
        window.ipc.on('onMessage', (msg) => {
            setMessageData((prevData) => [...prevData, msg]);
            message.success(`有新消息!`);
            setTimeout(() => { document.location.href = '#bottom' }, 2000)

        })
        window.ipc.invoke('getUserData').then((data) => {
            setUserData(data);
        })
    }, []);


    const handleTabChange = (tab: 'messages' | 'settings') => {
        setActiveTab(tab);
        tab == 'messages' ? setTimeout(() => { document.location.href = '#bottom' }, 80) : null;
    };

    const handleDownload = (url: string, filename: string) => {
        fetch(url)
            .then((response) => response.blob())
            .then((blob) => {
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(new Blob([blob]));
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch((error) => {
                console.error('Error downloading file:', error);
            });
    };


    const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
        if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight) {
            appendData();
        }
    };

    return (
        <Lo>
            <Layout style={{ maxHeight: '78vh' }}>
                <Sider width={70} theme="light">
                    <Menu mode="vertical" defaultSelectedKeys={['messages']}>
                        <Menu.Item onClick={() => handleTabChange('messages')} key="messages" icon={<MessageOutlined />} style={{ alignSelf: 'flex-end' }}>
                        </Menu.Item>
                        <Menu.Item onClick={() => handleTabChange('settings')} key="settings" icon={<SettingOutlined />} style={{ alignSelf: 'flex-end' }}>
                        </Menu.Item>

                    </Menu>
                </Sider>
                <Content style={{ margin: '8px', overflowY: 'auto', maxHeight: '75vh', minHeight: '75vh' }}>
                    {messageData.length > 0 || activeTab !== 'messages' ? null : <Empty></Empty>}
                    {activeTab === 'messages' && (
                        <><VirtualList
                            data={messageData}
                            itemHeight={100} // Adjust the itemHeight as per your requirement
                            itemKey={(item: MessageItem) => String(item.id)}
                            onScroll={onScroll}
                        >
                            {(item: MessageItem) => (
                                <List.Item key={item.id}>
                                    <Card style={{ margin: 3 }}>
                                        <Meta
                                            avatar={<Avatar size={40}>{item.sender}</Avatar>}
                                            title={item.title}
                                            description={<>
                                                <p>{`发送者： ${item.sender}`}</p>
                                                <p>{item.content}</p>
                                                {item.attachments && item.attachments.length > 0 && (
                                                    <>
                                                        <p>附件：</p>
                                                        <ul>
                                                            {item.attachments.map((attachment, index) => (
                                                                <li key={index}>
                                                                    <Space wrap>
                                                                        <Progress type="circle" percent={30} size={80} />
                                                                        <Progress type="circle" percent={70} size={80} status="exception" />
                                                                        <Progress type="circle" percent={100} size={80} />
                                                                    </Space>
                                                                    <Button
                                                                        style={{ margin: '5px' }}
                                                                        type="dashed"
                                                                        onClick={() => handleDownload(attachment.url, attachment.filename)}
                                                                    >
                                                                        {attachment.filename}
                                                                    </Button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </>} />
                                    </Card>
                                </List.Item>
                            )}

                        </VirtualList>
                            <div id="bottom"></div>
                        </>
                    )}
                    {activeTab === 'settings' && (
                        <Row align="middle" style={{ minHeight: '20vh', margin: 10 }}>
                            <Col style={{ margin: 10 }}>
                                <div>
                                    <Space>
                                        <Popover overlayInnerStyle={{ padding: 0 }} content={<QRCode value={JSON.stringify(userData)} bordered={false} />}>
                                            <Card title="基本信息" bordered={false}>
                                                <Space><TextField style={{ margin: 10 }}
                                                    disabled
                                                    id="outlined-disabled"
                                                    label="班级ID"
                                                    defaultValue={userData.userId}
                                                /></Space>

                                                <Space>
                                                    <TextField style={{ margin: 10 }}
                                                        disabled
                                                        id="outlined-disabled"
                                                        label="班级名称"
                                                        defaultValue={userData.userName}
                                                    /></Space>
                                            </Card>
                                        </Popover>
                                    </Space>
                                </div>
                            </Col>
                            <Card title="功能设置" bordered={false} style={{ margin: 10 }}>
                                <Col><Space><Switch defaultChecked onChange={() => { }} /><p>使用课程表</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={() => { }} /><p>开启消息提示</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={() => { }} /><p>自习作业展示</p></Space></Col>
                            </Card>
                            <Card title="定时任务设置" bordered={false} style={{ margin: 10 }}>
                                <Col><Space><Switch style={{ margin: 20 }} defaultChecked onChange={() => { }} /><p>开启定时任务</p></Space>
                                </Col>
                                <Col>
                                    <TimePicker onChange={() => { }} defaultOpenValue={dayjs('00:00:00', 'HH:mm:ss')} />
                                </Col>
                            </Card>

                        </Row>

                    )}
                </Content>
            </Layout></Lo>
    );
};

export default MessageList;

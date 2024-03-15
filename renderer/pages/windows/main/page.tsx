'use client'
import React, { ReactNode, useEffect, useState } from 'react';
import VirtualList from 'rc-virtual-list';
import { Avatar, Card, List, Button, Layout, Menu, message, Space, QRCode, Row, Col, Popover, Switch, TimePicker, Progress, Flex, Typography, Divider, Dropdown } from 'antd';
import { CaretDownOutlined, DownOutlined, FileOutlined, MessageOutlined, MoreOutlined, SettingOutlined } from '@ant-design/icons';
const { Header, Content, Sider } = Layout;
const { Meta } = Card;
import { Empty } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import TextField from "@mui/material/TextField";
import { Layout as Lo } from '../layout';
import { Margin } from '@mui/icons-material';
import { ipcMain } from 'electron';
import defauleConfig from '../../../../main/config'
import Icon from '@ant-design/icons/lib/components/Icon';

interface MessageItem {
    id: number;
    title: string;
    sender: string;
    content: string;
    attachments?: {
        url: string;
        filename: string;
        hashValue: string;
    }[];
}

interface task {
    description: string;
    id: number;
    cmd: string;
}

const items = [
    {
      key: '1',
      label: (
        <a target="_blank" rel="noopener noreferrer" href="https://www.antgroup.com">
          1st menu item
        </a>
      ),
    },
    {
      key: '4',
      danger: true,
      label: 'a danger item',
    },
  ];

const MessageList: React.FC = () => {
    const [messageData, setMessageData] = useState([]);
    const [config, setConfig] = useState(defauleConfig);
    const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');
    const [tasks, setTasks] = useState()

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
        window.ipc.on('download-progress', ({progress,hashValue} ) => {
            alert("收到进度:"+progress+"|"+hashValue)
            setDownloadProgresses((prevProgresses) => ({
                ...prevProgresses,
                [hashValue]: progress , // 更新对应的下载进度
            }));
        });
        window.ipc.invoke('getUserData').then((data) => {
            setUserData(data);
        })
        window.ipc.invoke('getConfig').then((data) => {
            setConfig(data);
        })
    }, []);


    const handleTabChange = (tab: 'messages' | 'settings') => {
        setActiveTab(tab);
        tab == 'messages' ? setTimeout(() => { document.location.href = '#bottom' }, 80) : null;
    };

    const handleDownload = (hashValue: string, filename: string) => {
        window.ipc.send('download-file',hashValue,filename)
    };


    const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
        if (e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight) {
            appendData();
        }
    };

    const [downloadProgresses, setDownloadProgresses] = useState({})


    return (
        <Lo>
            <Layout style={{ maxHeight: '78vh' }}>
                <Sider width={110} theme="light">
                    <Flex style={{ width: 111 }} justify='flex-start' align='flex-start'>
                        <Menu style={{ width: 111 }} defaultSelectedKeys={['messages']}>
                            <Menu.Item style={{ width: 90, alignSelf: 'flex-start' }} onClick={() => handleTabChange('messages')} key="messages" icon={<MessageOutlined />}>
                                消息
                            </Menu.Item>
                            <Menu.Item style={{ width: 90, alignSelf: 'flex-start' }} onClick={() => handleTabChange('settings')} key="settings" icon={<SettingOutlined />}>
                                设置
                            </Menu.Item>
                            <Menu.Item style={{ width: 90, alignSelf: 'flex-start' }} onClick={() =>{window.ipc.invoke('openHomeworkWindow')}} icon={<SettingOutlined />}>
                                作业
                            </Menu.Item>
                        </Menu>
                    </Flex>
                </Sider>
                <Content style={{ margin: 8, overflowY: 'auto', maxHeight: '75vh', minHeight: '75vh' }}>
                    {messageData.length > 0 || activeTab !== 'messages' ? null : <Empty></Empty>}
                    {activeTab === 'messages' && (
                        <><VirtualList
                            data={messageData}
                            itemHeight={100}
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
                                                <Divider></Divider>
                                                <p>{item.content}</p>
                                                {item.attachments && item.attachments.length > 0 && (
                                                    <>
                                                        <p>附件:</p>
                                                            {item.attachments.map((attachment, index) => {
                                                                // setDownloadProgresses({
                                                                //     ...downloadProgresses,
                                                                //     [attachment.hashValue]: 0,
                                                                // })
                                                                return (
                                                                        <><Space wrap>
                                                                        <Button
                                                                            icon={downloadProgresses[attachment.hashValue] ? (<Progress type="circle" percent={downloadProgresses[attachment.hashValue]} size={20} />) : (<FileOutlined />)}
                                                                            style={{ margin: '5px', maxWidth: 430 }}
                                                                            type="dashed"
                                                                            onClick={() => handleDownload(attachment.hashValue, attachment.filename)}
                                                                        >
                                                                            {attachment.filename.length > 50 ? attachment.filename.slice(0, 50) + "..." : attachment.filename}
                                                                        </Button>
                                                                    </Space>
                                                                    </>
                                                                )
                                                            }
                                                            )}
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
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => { window.ipc.invoke("setScheduleWindowDisplay", checked) }} /><p>使用课程表</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config;
                                    tempConfig.allowAlert = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }
                                } /><p>开启消息提示</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config;
                                    tempConfig.autoShowHomework = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>自习作业展示</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config;
                                    tempConfig.autoDownloadFiles = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>自动下载文件</p></Space></Col>
                            </Card>
                            <Card title="定时任务设置" bordered={false} style={{ margin: 10 }}>
                                <Col><Space><Switch style={{ margin: 20 }} defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config;
                                    tempConfig.useTasks = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>开启定时任务</p></Space>
                                </Col>
                                <Col>
                                    <List
                                        header={<div>任务列表</div>}
                                        footer={<div><Button>添加任务</Button></div>}
                                        bordered
                                        dataSource={tasks}
                                        renderItem={(item : task) => (
                                            <List.Item>
                                                <Typography.Text mark>[计划任务]</Typography.Text> {item.description}
                                            </List.Item>
                                        )}
                                    />
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

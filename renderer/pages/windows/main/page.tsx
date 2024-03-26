'use client'
import React, { ReactNode, useEffect, useState } from 'react';
import VirtualList from 'rc-virtual-list';
import { Avatar, Card, List, Button, Layout, Menu, message, Space, QRCode, Row, Col, Popover, Switch, TimePicker, Progress, Flex, Typography, Divider, Dropdown, Input } from 'antd';
import { BookOutlined, CaretDownOutlined, DownOutlined, DownloadOutlined, FileOutlined, MenuOutlined, MessageOutlined, MoreOutlined, SettingOutlined } from '@ant-design/icons';
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
import { CardContent } from '@mui/material';



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


const MessageList: React.FC = () => {
    const [messageData, setMessageData] = useState([]);
    const [config, setConfig] = useState(defauleConfig);
    const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');
    const [tasks, setTasks] = useState()
    const [getMsgStarter,setGetMsgStarter] = useState(-11);
    const [loadPointId,setLoadPointId] = useState(0);

    const appendData = async () => {
        await window.ipc.invoke('getMessages',getMsgStarter).then(([data,newStarter]) => {
            setGetMsgStarter(newStarter);
            if(!data){
                message.warning("没有更多了")
                return;
            }
            
            let downloadProgressesTemp = {};
            data.forEach(item => {
                if(item.attachments && item.attachments.length > 0){
                    item.attachments.forEach(attachment=>{
                        window.ipc.invoke('checkFileExistance', item.sender, attachment.filename).then((existance) => {
                            
                            if (existance) {
                                downloadProgressesTemp = {
                                    ...downloadProgressesTemp,
                                    [attachment.hashValue]: 100,
                                }
                            }
                            setDownloadProgresses(downloadProgressesTemp)
                        })
                    })
                }
            });
            setMessageData(messageData.concat(data));
            setLoadPointId(data[data.length-1].id)
            message.success(`${data.length} 条被加载!`);
            setTimeout(() => { document.location.href = '#loadPoint' }, 200)
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
            setTimeout(() => { document.location.href = '#bottom' }, 200)

        })
        window.ipc.on('download-progress', (progress: number, hashValue: string) => {
            setDownloadProgresses((prevProgresses) => ({
                ...prevProgresses,
                [hashValue]: progress, // 更新对应的下载进度
            }));
        });
        window.ipc.on('download-complete', (hashValue: string) => {
            setDownloadProgresses((prevProgresses) => ({
                ...prevProgresses,
                [hashValue]: 100,
            }));
        });
        window.ipc.on('download-error', (hashValue: string) => {
            setDownloadProgresses((prevProgresses) => ({
                ...prevProgresses,
                [hashValue]: -1,
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

    const handleDownload = (hashValue: string, filename: string, sender: string) => {
        window.ipc.send('download-file', hashValue, filename, sender)
    };

    function handleOpen(sender: string, filename: string,): void {
        window.ipc.invoke('openFile', sender, filename)
    }

    function handleOpenFolder(sender: string): void {
        window.ipc.invoke('openFolder', sender)
    }

    function fullScreenDisplay(msgid:number){
        messageData.forEach((msg:MessageItem)=>{
            if(msgid == msg.id){
                window.ipc.invoke('showSignalMessage',msg)
            }
        })
    }

    function DeleteMessage(msgid:number){
        messageData.forEach((msg:MessageItem,index)=>{
            if(msgid == msg.id){
                let temp = [...messageData];
                temp.splice(index,1);
                setMessageData(temp);
                window.ipc.invoke('delete-message',msgid).then((state)=>{
                    if(state == true){   
                        message.success("删除成功")  
                    }
                })
            }
        })  
    }

    const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
        if (e.currentTarget.scrollTop == 0&& activeTab == 'messages') {
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
                            <Menu.Item style={{ width: 90, alignSelf: 'flex-start' }} onClick={() => { window.ipc.invoke('openHomeworkWindow') }} icon={<BookOutlined />}>
                                作业
                            </Menu.Item>
                        </Menu>
                    </Flex>
                </Sider>
                <Content onScroll={onScroll} style={{ margin: 8, overflowY: 'auto', maxHeight: '75vh', minHeight: '75vh' }}>
                    {messageData.length > 0 || activeTab !== 'messages' ? null : <Empty></Empty>}
                    {activeTab === 'messages' && (
                        <><VirtualList
                            data={messageData}
                            itemHeight={100}
                            itemKey={(item: MessageItem) => item.id}
                             
                        >
                            {(item: MessageItem) => (
                                <List.Item key={item.id}>
                                    <Card style={{ margin: 3 }}>
                                        <Flex justify='space-between' align='flex-start'>
                                            <Meta

                                                avatar={<Avatar size={40}>{item.sender}</Avatar>}
                                                title={item.title ? item.title : "无标题"}
                                                description={`发送者： ${item.sender}`} />

                                            <Dropdown

                                                menu={{
                                                    items: [
                                                        {
                                                            label: <a onClick={()=>{fullScreenDisplay(item.id)}}>详细信息</a>,
                                                            key: '0',
                                                        },
                                                        {
                                                            type: 'divider',
                                                        },
                                                        {
                                                            label: <a onClick={()=>{DeleteMessage(item.id)}}>删除</a>,
                                                            key: '1',
                                                            danger: true,
                                                        },
                                                    ]
                                                }}
                                                trigger={['click']}>
                                                <a onClick={(e) => e.preventDefault()}>
                                                    <Space>
                                                        <MenuOutlined />
                                                    </Space>
                                                </a>
                                            </Dropdown>

                                        </Flex>

                                        <p>{item.content}</p>
                                        {item.attachments && item.attachments.length > 0 && (
                                            <>
                                                {item.attachments.map((attachment, index) => {
                                                    



                                                    return (
                                                        <Card type="inner">

                                                            <Flex justify='space-between' align='center'>
                                                                <Flex gap={15}><FileOutlined></FileOutlined><h4>{attachment.filename.length > 32 ? attachment.filename.substring(0, 32) + "..." : attachment.filename}</h4></Flex>
                                                                {
                                                                    downloadProgresses[attachment.hashValue] ?
                                                                        downloadProgresses[attachment.hashValue] == 100 ?
                                                                            <Flex gap={5}><Button
                                                                                onClick={() => handleOpen(item.sender, attachment.filename)}
                                                                            >
                                                                                打开
                                                                            </Button>
                                                                                <Button
                                                                                    onClick={() => handleOpenFolder(item.sender)}>
                                                                                    打开文件夹
                                                                                </Button></Flex> :
                                                                            null
                                                                        : <Button
                                                                            icon={<DownloadOutlined />}
                                                                            style={{ margin: '5px', maxWidth: 430 }}
                                                                            type="dashed"
                                                                            onClick={() => handleDownload(attachment.hashValue, attachment.filename, item.sender)}
                                                                        >
                                                                            下载
                                                                        </Button>
                                                                }

                                                            </Flex>
                                                            {
                                                                downloadProgresses[attachment.hashValue] ? (<><Progress status={downloadProgresses[attachment.hashValue] == -1 ? 'exception' : downloadProgresses[attachment.hashValue] == 100 ? 'success' : 'active'} percent={downloadProgresses[attachment.hashValue].toFixed(1)} /></>) :
                                                                    null}
                                                        </Card>

                                                    )
                                                }
                                                )}
                                            </>
                                        )}
                                    </Card>
                                    {loadPointId == item.id?<div id="loadPoint"></div>:null}
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
                                <Input placeholder="./downloads" />
                            </Card>
                            <Card title="定时任务设置" bordered={false} style={{ margin: 10 }}>
                                <Col><Space><Switch style={{ margin: 20 }} defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config;
                                    tempConfig.useTasks = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>开启定时任务</p></Space>
                                </Col>
                                <Col>
                                    <Button>打开任务面板</Button>

                                </Col>
                            </Card>

                        </Row>

                    )}
                </Content>
            </Layout></Lo>
    );
};

export default MessageList;

import React, { useEffect, useState } from 'react';
import { Button, Card, Row, Col, Empty, Dropdown, Slider, Space, Flex, ConfigProvider, List, Alert, Divider } from 'antd';
import Layout from './layout';
import { DownOutlined } from '@ant-design/icons';

const HomeworkPage = () => {
    const [homeworkData, setHomeworkData] = useState([]);
    const [fontSize, setFontSize] = useState(30); // 初始字体大小

    useEffect(() => {
        window.ipc.invoke('getHomeworkData').then((data) => {
            setHomeworkData(data);
        });

        const uploadHomeworkHandler = (homework) => {
            setHomeworkData((prevHomeworkData) => [...prevHomeworkData, homework]);
        };

        window.ipc.on('uploadHomework', uploadHomeworkHandler);

    }, []);

    // 更新字体大小的函数
    const changeFontSize = (size) => {
        setFontSize(size);
    };

    // 判断作业是否已经截止的函数
    const isHomeworkOverdue = (endTime) => {
        const currentTime = new Date();
        const [hour, minute] = endTime.split(':').map(Number);
        const endDateTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), hour, minute);
        return currentTime.getTime() > endDateTime.getTime();
    };

    return (
        <Layout rightElement={<Dropdown 
            menu={{
                items: [
                    {
                        label: <Slider onChange={(value)=>{
                            changeFontSize(value)
                        }} defaultValue={30}/>,
                        key: '0',
                    }
                ]
            }}
            trigger={['click']}>
            <a onClick={(e) => e.preventDefault()}>
                <Button >
                    <Space>
                        更改字体大小
                        <DownOutlined />
                    </Space>
                </Button>
            </a>
        </Dropdown>}>
        <List
            grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 4,
                lg: 4,
                xl: 6,
                xxl: 3,
            }}
            dataSource={homeworkData}
            renderItem={(homework) => (
                <List.Item>
                    <Card
                        extra={<Alert message={homework.endTime?homework.endTime + "截止":"今天截止"} type="info" />}
                        type="inner"
                        title={`${homework.subject}`}
                        style={{ marginBottom: '16px' }}
                    >
                        <p style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', fontSize: `${fontSize}px` }}>{homework.content}</p>
                        <Divider></Divider>
                        <div style={{ marginTop: 'auto', fontSize: `15px` }}>{"布置者 : " + homework.sender + "老师"}</div>
                    </Card>
                </List.Item>
            )}
        />
            
        </Layout>
    );
};

export default HomeworkPage;

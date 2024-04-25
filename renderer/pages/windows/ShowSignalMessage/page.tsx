'use client'
import React, {useEffect, useState} from 'react';
import { Card, Alert, Flex } from 'antd';
import Layout from '../layout';

const WarningCard = () => {
    const [title,setTitle] = useState("加载中...");
    const [content,setContent] = useState(" ");
    const [sender,setSender] = useState(" ");
    useEffect(() => {
        window.ipc.invoke('getShowingMessage').then((data)=>{
            setContent(data.content)
            setTitle(data.title)
            setSender(data.sender)
        })
    }, []);
    return (
        <Layout><Flex justify='center' align='center'><Card title={title} bordered={true} style={{width: 500}}>
            {content}
        </Card>
        </Flex></Layout>
    );
};

export default WarningCard;

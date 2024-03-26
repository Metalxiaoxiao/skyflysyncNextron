'use client'
import React, {useEffect, useState} from 'react';
import { Card, Alert } from 'antd';
import Layout from '../layout';

const WarningCard = () => {
    const [title,setTitle] = useState("加载中...");
    const [content,setContent] = useState(" ");
    const [sender,setSender] = useState(" ");
    useEffect(() => {
        window.ipc.invoke('getShowingMessage').then((data)=>{
            setContent(data.content.data.content)
            setTitle(data.content.data.title)
            setSender(data.content.data.sender)
        })
    }, []);
    return (
        <Layout><Card title={title} bordered={true} style={{width: 500}}>
        {content}

    </Card></Layout>
    );
};

export default WarningCard;

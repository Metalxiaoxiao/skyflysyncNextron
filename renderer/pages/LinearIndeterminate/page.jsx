'use client'
import * as React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { Card } from 'antd';

export default function Page() {
    return (
            <Card title="尝试自动登录..." bordered={false} style={{width: 300}}>
                <LinearProgress/>
            </Card>)
    ;
}

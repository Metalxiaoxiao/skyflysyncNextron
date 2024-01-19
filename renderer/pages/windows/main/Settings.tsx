// Settings.jsx
import React from 'react';
import { Form, Input, Button, Switch } from 'antd';

const Settings = () => {
    const onFinish = (values) => {
        // 处理设置项的提交逻辑
        console.log('Received values:', values);
    };

    return (
        <div>
            <h2>设置</h2>
            <Form
                name="settingsForm"
                onFinish={onFinish}
                initialValues={{ notifications: true }}
                layout="vertical"
            >
                <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ required: true, message: '请输入用户名' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[{ required: true, message: '请输入邮箱' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="notifications"
                    label="接收通知"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        保存设置
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Settings;

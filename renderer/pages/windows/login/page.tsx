'use client'
import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Button, Card, CardActions, CardContent, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, ScopedCssBaseline, Stack, Typography } from '@mui/material';
import { VisibilityOff, Visibility } from '@mui/icons-material';
import {useEffect} from "react";
import Layout from '../layout';



export default function Home() {
    var classes: Array<string> = [];
    var i: number = 870
    while (i <= 903) {
        // if (i === 874) {
        //   continue;
        // }
        classes.push(i.toString());
        i++;
    }

    const [selectedClass, setSelectedClass] = React.useState(''); // 用于跟踪选定的班级
    const [password, setPassword] = React.useState(''); // 用于跟踪密码输入框的值
    const [showPassword, setShowPassword] = React.useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    useEffect(() => {
        // Setup IPCRenderer to send messages to Electron
    }, []);

    const card = (
        <Layout>
        <React.Fragment>
            <CardContent>
                <Typography sx={{m: 2 }} variant="h6" gutterBottom>
                    设置 SkyflySync 白板
                </Typography>
                <Stack direction="column" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Autocomplete
                        disablePortal
                        id="classAccount"
                        options={classes}
                        sx={{ m: 1, width: '100%' }}
                        onChange={(event, value) => {
                            setSelectedClass(String(value));
                        }}
                        renderInput={(params) => <TextField {...params} label="班级" />}
                    />
                    <FormControl sx={{ m: 1, width: '100%' }} variant="outlined">
                        <InputLabel htmlFor="outlined-adornment-password">管理密码</InputLabel>
                        <OutlinedInput
                            id="outlined-adornment-password"
                            type={showPassword ? 'text' : 'password'}
                            onChange={(event) => {
                                setPassword(String(event.target.value));
                            }}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="管理密码"
                        />
                        <Stack sx={{ width: '90%', m: 2 }} direction="column" spacing={1}>
                            <Button onClick={() => {
                                window.ipc.send('nextjs-message', {
                                    command: "register",
                                    content: {
                                        userName: selectedClass,
                                        userPassword: password,
                                        deviceType: 1
                                    }
                                })
                            }} size="large" variant="contained">登录</Button>
                            <Button size="small" variant="text">填写后将自动注册账号</Button>
                        </Stack>
                    </FormControl>
                </Stack>
            </CardContent>
        </React.Fragment></Layout>
    );

    return (
        <ScopedCssBaseline enableColorScheme>
            <Card variant="outlined">
                {card}
            </Card>
        </ScopedCssBaseline>
    )
}

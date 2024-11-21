import { useNavigate } from 'react-router-dom';
import { Button, Input, Form } from 'antd';
import type { FormProps } from 'antd';
import { authenticate } from '@/services/authenticate';
import StyledHeader from '@/components/Header';


type FieldType = {
  email: string;
  password: string;
};

const Login = () => {

  const Navigate = useNavigate();

const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
  console.log('Success:', values);
  if (values){
    authenticate(values.email, values.password)
    Navigate('/dashboard');
  }
};

const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
  console.log('Failed:', errorInfo);
};

  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <StyledHeader />
      <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item<FieldType>
        label="Email"
        name="email"
        rules={[{ required: true, message: 'Please input your email.' }]}
      >
        <Input />
      </Form.Item>
  
      <Form.Item<FieldType>
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password autoComplete='current-password'/>
      </Form.Item>
  
      <Form.Item label={null}>
        <Button type="primary" htmlType="submit" size='large'>
          Submit
        </Button>
      </Form.Item>
    </Form>
    </span>

  );
}

export default Login
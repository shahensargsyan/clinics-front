import { Form, Input, Button, Card, App } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginUser } from '../../api/generated/auth/auth';
import type { LoginRequest } from '../../api/generated/model';
import { tokenStorage, userStorage } from '../../api/token-storage';

export function LoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { mutate, isPending } = useLoginUser({
    mutation: {
      onSuccess: (res) => {
        tokenStorage.set(res.access_token);
        userStorage.set(res.user);
        message.success(`Welcome, ${res.user.name}`);
        navigate(params.get('returnUrl') ?? '/patients', { replace: true });
      },
      onError: () => message.error('Invalid email or password'),
    },
  });

  // The backend names the email field `username` (Laravel guard parity).
  const onFinish = (values: LoginRequest) => mutate({ data: values });

  return (
    <Card title="Admin sign in" style={{ maxWidth: 360, margin: '10vh auto' }}>
      <Form layout="vertical" onFinish={onFinish} disabled={isPending}>
        <Form.Item label="Email" name="username" rules={[{ required: true, type: 'email' }]}>
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isPending}>
          Sign in
        </Button>
      </Form>
    </Card>
  );
}

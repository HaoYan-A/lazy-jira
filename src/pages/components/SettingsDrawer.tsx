import React, { useState, useEffect } from 'react';
import { Drawer, Form, Select, Button, message, Spin } from 'antd';
import { Board, Sprint } from '../../services/jiraApi';

const { Option } = Select;

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  boards: Board[];
  sprints: Sprint[];
  selectedBoard: number | null;
  selectedSprint: number | null;
  onBoardChange: (boardId: number) => void;
  onSprintChange: (sprintId: number) => void;
  loading: boolean;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  visible,
  onClose,
  boards,
  sprints,
  selectedBoard,
  selectedSprint,
  onBoardChange,
  onSprintChange,
  loading
}) => {
  const [form] = Form.useForm();
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setDrawerVisible(true);
      form.setFieldsValue({
        board: selectedBoard,
        sprint: selectedSprint,
      });
    } else {
      setDrawerVisible(false);
    }
  }, [visible, selectedBoard, selectedSprint, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      localStorage.setItem('selectedBoard', values.board.toString());
      localStorage.setItem('selectedSprint', values.sprint.toString());
      onBoardChange(values.board);
      onSprintChange(values.sprint);
      message.success('设置已保存');
      onClose();
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  const handleClose = () => {
    setDrawerVisible(false);
    onClose();
  };

  return (
    <Drawer
      title="设置"
      placement="left"
      onClose={handleClose}
      open={drawerVisible}
      width={400}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="board"
            label="默认看板"
            rules={[{ required: true, message: '请选择看板' }]}
          >
            <Select
              showSearch
              placeholder="选择看板"
              optionFilterProp="children"
              onChange={(value) => {
                onBoardChange(value);
              }}
            >
              {boards.map(board => (
                <Option key={board.id} value={board.id}>
                  {board.name} {board.projectName ? `(${board.projectName})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sprint"
            label="默认 Sprint"
            rules={[{ required: true, message: '请选择 Sprint' }]}
          >
            <Select
              showSearch
              placeholder="选择 Sprint"
              optionFilterProp="children"
              disabled={!selectedBoard}
              onChange={(value) => {
                onSprintChange(value);
              }}
            >
              {sprints.map(sprint => (
                <Option key={sprint.id} value={sprint.id}>
                  {sprint.name} ({sprint.state})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSave}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
};

export default SettingsDrawer; 
import { useCallback, useEffect, useState } from "react";
import { getLang } from "../locales";
import { Col, Row, Space, Switch } from "antd";
import { Model, useAppConfig } from "../store/config";

function ModelItem(props: {
  model: Model;
  onChange?: (checked: boolean) => void;
}) {
  const lang = getLang();

  return (
    <Row wrap={false} align="middle">
      <Col flex="auto" style={{ paddingRight: "10px" }}>
        {props.model.model}
        {props.model.remark
          ? lang === "cn"
            ? ` (${props.model.remark})`
            : ` (${props.model.en_remark})`
          : null}
      </Col>
      <Col flex="none">
        <Switch
          checked={props.model.enable}
          onChange={(checked: boolean) => props.onChange?.(checked)}
        />
      </Col>
    </Row>
  );
}

export function SidebarModelList(props: { narrow?: boolean }) {
  const appConfig = useAppConfig();
  const modelList = appConfig.modelList;

  const onChange = useCallback(
    (checked: boolean, model: Model) => {
      const models = [...modelList];
      for (let i = 0; i < models.length; i++) {
        const item = models[i];
        if (item.id === model.id) {
          item.enable = checked;
          break;
        }
      }
      appConfig.update((config) => {
        config.modelList = models;
      });
    },
    [modelList],
  );

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        {modelList.map((model) => (
          <ModelItem
            model={model}
            key={model.id}
            onChange={(checked: boolean) => {
              onChange(checked, model);
            }}
          />
        ))}
      </Space>
    </div>
  );
}

import Resource from './resource'

export type RoleDefinition = {
  DependsOn: string[];
  Properties: {
    PermissionsBoundary?: string;
    AssumeRolePolicyDocument: any;
    Policies: any[];
    RoleName: string;
  };
  Type: string;
}

export default class Role extends Resource {
  private readonly type: string = 'AWS::IAM::Role'
  private readonly version: string = '2012-10-17'
  private readonly permissionsBoundary?: string
  private readonly actions = {
    CloudWatch: [
      'cloudwatch:PutMetricAlarm',
      'cloudwatch:DescribeAlarms',
      'cloudwatch:DeleteAlarms',
      'cloudwatch:GetMetricStatistics',
      'cloudwatch:SetAlarmState'
    ],
    DynamoDB: [
      'dynamodb:DescribeTable',
      'dynamodb:UpdateTable'
    ]
  }

  constructor(
    options: Options,
    permissionsBoundary?: string
  ) {
    super(options)
    this.permissionsBoundary = permissionsBoundary
  }

  public toJSON(): Record<string, RoleDefinition> {
    const RoleName = this.name.role()
    const PolicyName = this.name.policyRole()

    const DependsOn = [this.options.table].concat(this.dependencies)
    const Principal = this.principal()
    const Version = this.version
    const Type = this.type

    const roleDefinition: RoleDefinition = {
      DependsOn,
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {Action: 'sts:AssumeRole', Effect: 'Allow', Principal}
          ],
          Version
        },
        Policies: [
          {
            PolicyDocument: {
              Statement: [
                {Action: this.actions.CloudWatch, Effect: 'Allow', Resource: '*'},
                {Action: this.actions.DynamoDB, Effect: 'Allow', Resource: this.resource()}
              ],
              Version
            },
            PolicyName
          }
        ],
        RoleName
      },
      Type
    }

    if (this.permissionsBoundary) {
      roleDefinition.Properties.PermissionsBoundary = this.permissionsBoundary
    }

    return {
      [RoleName]: roleDefinition
    }
  }

  private resource(): {} {
    return {
      'Fn::Join': ['', ['arn:aws:dynamodb:*:', {Ref: 'AWS::AccountId'}, ':table/', {Ref: this.options.table}]]
    }
  }

  private principal(): {} {
    return {
      Service: 'application-autoscaling.amazonaws.com'
    }
  }
}
